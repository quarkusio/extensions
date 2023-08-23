//const fetch = require("node-fetch")  // TODO is this needed when test mocks it?
const promiseRetry = require("promise-retry")
const PersistableCache = require("./persistable-cache")

// We store the raw(ish) data in the cache, to avoid repeating the same request multiple times and upsetting the github rate limiter
const DAY_IN_SECONDS = 60 * 60 * 24
const DAY_IN_MILLISECONDS = 1000 * DAY_IN_SECONDS

const cacheOptions = { stdTTL: 4 * DAY_IN_SECONDS }
const CACHE_KEY = "github-api-for-contributions"
const COMPANY_CACHE_KEY = CACHE_KEY + "-company"
const REPO_CACHE_KEY = CACHE_KEY + "-repo"

const repoContributorCache = new PersistableCache(cacheOptions)
const companyCache = new PersistableCache(cacheOptions)

let minimumContributorCount = 2
let minimumContributionPercent = 25

// Only consider users who have a minimum number of contributions
let minContributionCount = 3

const setMinimumContributionPercent = n => {
  minimumContributionPercent = n
}

const setMinimumContributorCount = n => {
  minimumContributorCount = n
}

const setMinimumContributionCount = n => {
  minContributionCount = n
}

const initSponsorCache = (cache) => {
  companyCache.ingestDump(cache.get(COMPANY_CACHE_KEY))
  repoContributorCache.ingestDump(cache.get(REPO_CACHE_KEY))

}

const clearCaches = () => {
  repoContributorCache.flushAll()
  companyCache.flushAll()
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

async function tolerantFetch(url) {
  const accessToken = process.env.GITHUB_TOKEN

  const headers = accessToken
    ? {
      Authorization: `Bearer ${accessToken}`,
    }
    : {}
  const body = await promiseRetry(
    async retry => {
      // TODO still ask, but without auth if token is missing
      const res = await fetch(url, {
        method: "GET",
        headers,
      })
      const ghBody = await res.json()
      if (!ghBody) {
        retry(
          `Unsuccessful GitHub fetch for ${url} - response is ${JSON.stringify(
            ghBody
          )}`
        )
      }
      return ghBody
    },
    { retries: 3, minTimeout: 10 * 1000, factor: 5 }
  ).catch(e => {
    // Do not break the build for this, warn and carry on
    console.warn(e)
    return undefined
  })

  if (body?.errors || body?.message) {
    console.warn(
      `Could not get GitHub information for ${url} - response is ${JSON.stringify(
        body
      )}`
    )
    return undefined
  }

  return body
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
  const accessToken = process.env.GITHUB_TOKEN

  if (accessToken) {
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

    const body = await promiseRetry(
      async retry => {
        const res = await fetch("https://api.github.com/graphql", {
          method: "POST",
          body: JSON.stringify({ query }),
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        const ghBody = await res.json()
        if (!ghBody?.data) {
          retry(
            `Unsuccessful GitHub fetch for ${org}:${project} - response is ${JSON.stringify(
              ghBody,
            )}`,
          )
        }
        return ghBody
      },
      { retries: 3, minTimeout: 10 * 1000 }
    ).catch(e => {
      // Do not break the build for this, warn and carry on
      console.warn(e)
      return undefined
    })

    if (body?.errors) {
      console.warn(
        `Could not get GitHub information for ${artifactId} - response is ${JSON.stringify(
          body
        )}`
      )
    }


    if (body?.data && body?.data?.repository) {
      const returnedData = body?.data?.repository
      const ghBody = returnedData

      const history = ghBody?.defaultBranchRef?.target?.history?.edges

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
  } else {
    console.warn(
      "Cannot read contributor information, because the environment variable `GITHUB_TOKEN` has not been set."
    )
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

const findSponsorFromContributorList = async (userContributions) => {

  // The GraphQL API, unlike the REST API, does not list a type for users, so we can only detect bots from name inspection
  const notBots = userContributions
    .filter(user => user.login && !user.login.includes("[bot]"))
    .filter(user => user.login !== "actions-user")
    .filter(user => user.login !== "quarkiversebot")

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

  const sorted = majorProportions.sort((c, d) => d.commits - c.commits)

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

      companyName = companyName.trim()
    }

    return companyName
  }
}

const getCompanyFromGitHubLogin = async company => {

  const url = `https://api.github.com/users/${company}`
  const ghBody = await tolerantFetch(url)

  let name = ghBody?.name

  // Some companies do not set a name, so just set the id in that case
  if (!name) {
    name = company
  }

  return name
}

const saveSponsorCache = (cache) => {
  companyCache.set(COMPANY_CACHE_KEY, companyCache.dump())
  repoContributorCache.set(REPO_CACHE_KEY, repoContributorCache.dump())
}

module.exports = {
  findSponsor,
  clearCaches,
  initSponsorCache,
  saveSponsorCache,
  setMinimumContributorCount,
  setMinimumContributionPercent, setMinimumContributionCount,
  normalizeCompanyName,
  findSponsorFromContributorList
}
