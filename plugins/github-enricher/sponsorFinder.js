const PersistableCache = require("../../src/persistable-cache")
const { queryGraphQl, queryRest } = require("./github-helper")

// We store the raw(ish) data in the cache, to avoid repeating the same request multiple times and upsetting the github rate limiter
const DAY_IN_SECONDS = 60 * 60 * 24
const DAY_IN_MILLISECONDS = 1000 * DAY_IN_SECONDS

let repoContributorCache, companyCache

let minimumContributorCount = 1
let minimumContributionPercent = 35

const setMinimumContributionPercent = n => {
  minimumContributionPercent = n
}

const setMinimumContributorCount = n => {
  minimumContributorCount = n
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
}

const getContributors = async (org, project, inPath) => {
  if (org && project) {
    // If inPath is undefined, that's fine, we'll use it in the key without ill effect
    const key = org + ":" + project + inPath
    const { collatedHistory, lastUpdated } = await repoContributorCache.getOrSet(
      key,
      () => getContributorsNoCache(org, project, inPath)
    ) ?? {}

    if (collatedHistory) {
      // Don't cache our company calculations
      const contributors = collatedHistory?.map(user => {
        const { name, login, contributions, url, company } = user
        return { name: name || login, login, contributions, url, company }
      }).filter(notBot)

      const companies = Object.values(contributors.reduce((acc, user) => {
        const company = user.company || "Unknown"
        if (acc[company]) {
          acc[company].contributions = acc[company].contributions + user.contributions
          acc[company].contributors = acc[company].contributors + 1
        } else {
          acc[company] = { name: company, contributions: user.contributions, contributors: 1 }
        }
        return acc
      }, {}))

      const sortedCompanies = companies.sort((c, d) => d.contributions - c.contributions)

      return { contributors, companies: sortedCompanies, lastUpdated }
    }
  }

}

const getContributorsNoCache = async (org, project, inPath) => {
  const pathParam = inPath ? `path: "${inPath}", ` : ""
  // We're only doing one, easy, date manipulation, so don't bother with a library
  const timePeriodInDays = 180
  const someMonthsAgo = new Date(Date.now() - timePeriodInDays * DAY_IN_MILLISECONDS).toISOString()
  const query = `query { 
  repository(owner: "${org}", name: "${project}") {
    defaultBranchRef{
        target{
              ... on Commit{
                  history(${pathParam} since: "${someMonthsAgo}"){
                      edges{
                          node{
                              ... on Commit{
                                parents(first: 1) {
                                  totalCount
                                }
                                 
                                  author {
                                    user {
                                      login
                                      name
                                      company
                                      url
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

      // Filter out merge commits
      const historyWithoutMerges = history.filter(o => o?.node?.parents?.totalCount === 1)

      let users = historyWithoutMerges.map(o => o?.node?.author?.user)

      // Some commits have an author who doesn't have a github mapping, so filter those out
      users = users.filter(user => user !== null && user !== undefined)

      // Normalise company names
      users = await Promise.all(users.map(async user => {
        const normalisedCompany = await resolveAndNormalizeCompanyName(user.company)
        return { ...user, company: normalisedCompany }
      }))

      const collatedHistory = Object.values(users.reduce((acc, user) => {
        if (acc[user.login]) {
          acc[user.login].contributions = acc[user.login].contributions + 1
        } else {
          acc[user.login] = { ...user, contributions: 1 }
        }
        return acc
      }, []))

      return { collatedHistory, lastUpdated: Date.now() }
    }
  }

}

const findSponsor = async (org, project, path) => {
  // Cache the github response and aggregation, but not the calculation of sponsors, since we may change the algorithm for it
  const { companies } = await getContributors(org, project, path) ?? {}
  // We don't want to persist the sponsor calculations across builds; we could cache it locally but it's probably not worth it
  if (companies) {
    return findSponsorFromContributorList(companies)
  }
}

const notBot = (user) => {
  // The GraphQL API, unlike the REST API, does not list a type for users, so we can only detect bots from name inspection
  return user.login && !user.login.includes("[bot]") && user.login !== "actions-user" && user.login !== "quarkiversebot"
}

const findSponsorFromContributorList = async (companies) => {


  const totalContributions = companies.reduce(
    (acc, comp) => acc + comp.contributions,
    0
  )

  const noSolos = Object.values(companies).filter(
    company => company.contributors >= minimumContributorCount
  )

  const majorProportions = Object.values(noSolos).filter(
    company => (company.contributions * 100) / totalContributions >=
      minimumContributionPercent
  )

  const answer = majorProportions.map(val => val.name)

  // Return undefined instead of an empty array
  return answer.length > 0 ? answer : undefined
}

const resolveAndNormalizeCompanyName = async (company) => {
  // Even though we have a company, we need to do postprocessing

  if (company) {
    if (company.startsWith("@")) {
      // Only take the first entry after the @
      const split = company.split(/[@ ]/)
      // The first array element is an empty string where the @ was, so take the second
      return normalizeCompanyName(await getCompanyFromGitHubLogin(split[1]))
    } else {
      return normalizeCompanyName(company)
    }
  }
}

const normalizeCompanyName = (company) => {

  if (!company) return

  // Do some normalisation
  // This is a bit fragile, and we just have to handle patterns as we discover them
  let companyName = company
    .replace(", Inc.", "")
    .replace(", Inc", "")
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

  // Strip out commas and whitespace
  companyName = companyName.replace(",", "")
  companyName = companyName?.trim()

  return companyName
}


const getCompanyFromGitHubLogin = async (company) => {
  if (company) {
    return await companyCache.getOrSet(
      company,
      () => getCompanyFromGitHubLoginNoCache(company)
    )
  }
}

const getCompanyFromGitHubLoginNoCache = async company => {

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
  console.log("Persisted contributor information for", repoContributorCache.size(), "cached repositories and paths within those repositories.")
}

module.exports = {
  findSponsor,
  getContributors,
  clearCaches,
  initSponsorCache,
  saveSponsorCache,
  setMinimumContributorCount,
  setMinimumContributionPercent,
  resolveAndNormalizeCompanyName,
  normalizeCompanyName,
  findSponsorFromContributorList
}
