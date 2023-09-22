const PersistableCache = require("./persistable-cache")
const yaml = require("js-yaml")
const { getRawFileContents, queryGraphQl, queryRest } = require("./github-helper")

// We store the raw(ish) data in the cache, to avoid repeating the same request multiple times and upsetting the github rate limiter
const DAY_IN_SECONDS = 60 * 60 * 24
const DAY_IN_MILLISECONDS = 1000 * DAY_IN_SECONDS

let repoContributorCache, companyCache

let minimumContributorCount = 2
let minimumContributionPercent = 20

// Only consider users who have a significant number of contributions
let minContributionCount = 5

let optedInSponsors

const setMinimumContributionPercent = n => {
  minimumContributionPercent = n
}

const setMinimumContributorCount = n => {
  minimumContributorCount = n
}

const setMinimumContributionCount = n => {
  minContributionCount = n
}

const initSponsorCache = async () => {
  // If there are problems with the cache, it works well to add something like companyCache.flushAll() on a main-branch build
  // (and then remove it next build)

  repoContributorCache = new PersistableCache({
    key: "github-api-for-contribution-repo",
    stdTTL: 2 * DAY_IN_SECONDS
  })
  companyCache = new PersistableCache({ key: "github-api-for-contribution-company", stdTTL: 1.5 * DAY_IN_SECONDS })

  await companyCache.ready()
  console.log("Ingested", companyCache.size(), "cached companies.")
  await repoContributorCache.ready()
  console.log("Ingested contributor information for", repoContributorCache.size(), "cached repositories.")
}

const clearCaches = () => {
  repoContributorCache?.flushAll()
  companyCache?.flushAll()
  optedInSponsors = undefined
}

const getSponsorData = async () => {
  if (!optedInSponsors) {

    const org = "quarkusio"
    const repo = "quarkus-extension-catalog"
    const path = "named-contributing-orgs-opt-in.yml"


    const yamlString = await getRawFileContents(org, repo, path)

    if (yamlString) {
      const json = yaml.load(yamlString)

      optedInSponsors = await json
    } else {
      console.warn("Could not fetch sponsor opt in information from", url, ". Does the file exist?")
      optedInSponsors = {}
    }
  }
  return optedInSponsors
}

const getOrSetFromCache = async (cache, key, functionThatReturnsAPromise) => {
  if (cache.has(key)) {
    return cache.get(key)
  } else {
    const answer = await functionThatReturnsAPromise()
    cache.set(key, answer)
    return answer
  }
}


const getUserContributions = async (org, project) => {
  if (org && project) {
    const key = org + ":" + project
    return await getOrSetFromCache(
      repoContributorCache,
      key,
      getUserContributionsNoCache.bind(this, org, project)
    )
  }
}

const getUserContributionsNoCache = async (org, project) => {
  // We're only doing one, easy, date manipulation, so don't bother with a library
  const timePeriodInDays = 180
  const someMonthsAgo = new Date(Date.now() - timePeriodInDays * DAY_IN_MILLISECONDS).toISOString()
  const query = `query { 
  repository(owner: "${org}", name: "${project}") {
    defaultBranchRef{
        target{
            ... on Commit{
                history(since: "${someMonthsAgo}"){
                    edges{
                        node{
                            ... on Commit{
                                author {
                                  user {
                                    login
                                    name
                                    company
                                  }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
}`

  const body = await queryGraphQl(query)

  if (body?.data && body?.data?.repository) {
    const history = body?.data?.repository?.defaultBranchRef?.target?.history?.edges

    if (history && Array.isArray(history)) {
      let users = history.map(o => o?.node?.author?.user)

      // Some commits have an author who doesn't have a github mapping, so filter those out
      users = users.filter(user => user !== null && user !== undefined)


      const collatedHistory = Object.values(users.reduce((acc, user) => {
        if (acc[user.login]) {
          acc[user.login].contributions = acc[user.login].contributions + 1
        } else {
          acc[user.login] = { ...user, contributions: 1 }
        }
        return acc
      }, []))

      return collatedHistory
    }
  }

}

const findSponsor = async (org, project) => {
  // Cache the github response and aggregation, but not the calculation of sponsors, since we may change the algorithm for it
  const collatedHistory = await getUserContributions(org, project)
  if (collatedHistory) {
    // We don't want to persist the sponsor calculations across builds; we could cache it locally but it's probably not worth it
    return findSponsorFromContributorList(collatedHistory)
  }
}

const notBot = (user) => {
  return user.login && !user.login.includes("[bot]") && user.login !== "actions-user" && user.login !== "quarkiversebot"
}

const getContributors = async (org, project) => {
  const collatedHistory = await getUserContributions(org, project)
  return collatedHistory?.map(user => {
    const { name, login, contributions } = user
    return { name: name || login, login, contributions }
  }).filter(notBot)
}

const findSponsorFromContributorList = async (userContributions) => {

  // The GraphQL API, unlike the REST API, does not list a type for users, so we can only detect bots from name inspection
  const notBots = userContributions
    .filter(notBot)

  const totalContributions = notBots.reduce(
    (acc, user) => acc + user.contributions,
    0
  )

  const significantContributors = notBots.filter(
    user => user.contributions >= minContributionCount
  )

  const companies = significantContributors.map(async user => {
    return {
      company: await normalizeCompanyName(user.company),
      commits: user.contributions,
      login: user.login,
    }
  })
  const allCompanies = await Promise.all(companies)
  const filtered = allCompanies.filter(user => user !== undefined)
  const commits = filtered.reduce((acc, user) => {
    const company = user.company
    if (company) {
      if (acc[company]) {
        acc[company].commits = acc[company].commits + user.commits
        acc[company].contributors = acc[company].contributors + 1
      } else {
        acc[company] = { company, commits: user.commits, contributors: 1 }
      }
    }
    return acc
  }, {})

  const noSolos = Object.values(commits).filter(
    company => company.contributors >= minimumContributorCount
  )

  const majorProportions = Object.values(noSolos).filter(
    company =>
      (company.commits * 100) / totalContributions >=
      minimumContributionPercent
  )

  const sponsorData = await getSponsorData()

  // The case should be the same on the opt in list and GitHub info, but do a case-insensitive comparison to be sade

  const namedSponsors = sponsorData["named-sponsors"].map(name => name.toLowerCase())
  const onlyOptIns = majorProportions.filter(company => namedSponsors && namedSponsors.includes(company.company.toLowerCase()))

  const sorted = onlyOptIns.sort((c, d) => d.commits - c.commits)

  const answer = sorted.map(val => val.company)

  // Return undefined instead of an empty array
  return answer.length > 0 ? answer : undefined
}

const normalizeCompanyName = async (company) => {
  if (company) {
    return await getOrSetFromCache(
      companyCache,
      company,
      normalizeCompanyNameNoCache.bind(this, company)
    )
  }
}

const normalizeCompanyNameNoCache = async (company) => {
  // Even though we have a company, we need to do postprocessing

  if (company) {
    let companyName
    if (company.startsWith("@")) {
      companyName = await getCompanyFromGitHubLogin(company.replace("@", ""))
    } else {
      // Do some normalisation
      // This is a bit fragile, and we just have to handle patterns as we discover them
      companyName = company
        .replace(", Inc.", "")
        .replace(", Inc", "")
        .replace(" Inc", "")
        .replace("  GmbH", "")

      // The ? makes the match non-greedy
      const parenthesisMatch = companyName.match(/(.*?) \(.*\)/)
      if (parenthesisMatch) {
        companyName = parenthesisMatch[1]
      }

      const atMatch = companyName.match(/(.*?)( - )?@.*/)
      if (atMatch) {
        companyName = atMatch[1]
      }

      const byMatch = companyName.match(/(.*?) by .*/)
      if (byMatch) {
        companyName = byMatch[1]
      }

      // Special case for some acquisitions
      companyName = companyName.replace("JBoss", "Red Hat")

      // Special case for some URLs
      companyName = companyName.replace("https://www.redhat.com/", "Red Hat")
      companyName = companyName.replace("http://www.redhat.com/", "Red Hat")
    }
    companyName = companyName?.trim()

    return companyName
  }
}

const getCompanyFromGitHubLogin = async company => {

  const ghBody = await queryRest(`users/${company}`)

  let name = ghBody?.name

  // Some companies do not set a name, so just set the id in that case
  if (!name) {
    name = company
  }

  return name
}

const saveSponsorCache = async () => {
  await companyCache.persist()
  console.log("Persisted", companyCache.size(), "cached companies.")
  await repoContributorCache.persist()
  console.log("Persisted contributor information for", repoContributorCache.size(), "cached repositories.")
}

module.exports = {
  findSponsor,
  getContributors,
  clearCaches,
  initSponsorCache,
  saveSponsorCache,
  setMinimumContributorCount,
  setMinimumContributionPercent, setMinimumContributionCount,
  normalizeCompanyName,
  findSponsorFromContributorList
}
