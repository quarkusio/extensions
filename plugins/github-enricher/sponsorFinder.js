//const fetch = require("node-fetch")  // TODO is this needed when test mocks it?
const promiseRetry = require("promise-retry")

const accessToken = process.env.GITHUB_TOKEN

// We store the promises in the cache, to avoid repeating the same request multiple times
let repoCache = {}
let userCache = {}
let companyCache = {}

let minimumContributorCount = 2

const setMinimumContributorCount = n => {
  minimumContributorCount = n
}

const clearCaches = () => {
  repoCache = {}
  userCache = {}
  companyCache = {}
}

const getOrSetFromCache = async (cache, key, functionThatReturnsAPromise) => {
  if (key in cache) {
    return await cache[key]
  } else {
    const answer = functionThatReturnsAPromise()
    cache[key] = answer
    return await answer
  }
}

async function tolerantFetch(url) {
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

const findSponsor = async (org, project) => {
  if (org && project) {
    const key = org + ":" + project
    return await getOrSetFromCache(
      repoCache,
      key,
      findSponsorNoCache.bind(this, org, project)
    )
  }
}

const findSponsorNoCache = async (org, project) => {
  // We can't get the contributors using the graphql API, so use the web API
  const url = `https://api.github.com/repos/${org}/${project}/contributors`
  const ghBody = await tolerantFetch(url)

  // The contributors list is sorted in descending order

  // Only consider users who have a minimum number of contributions

  const minContributionCount = 5
  if (ghBody && Array.isArray(ghBody)) {
    const notBots = ghBody
      .filter(user => user.type !== "Bot")
      .filter(user => user.login !== "actions-user")
      .filter(user => user.login !== "quarkiversebot")

    const totalContributions = notBots.reduce(
      (acc, user) => acc + user.contributions,
      0
    )

    const significantContributors = notBots.filter(
      user => user.contributions > minContributionCount
    )

    const companies = significantContributors.map(async user => {
      return {
        company: await getCompanyForUser(user.login, user.url),
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

    const minimumContributionProportion = 25

    const majorProportions = Object.values(noSolos).filter(
      company =>
        (company.commits * 100) / totalContributions >=
        minimumContributionProportion
    )

    const sorted = majorProportions.sort((c, d) => d.commits - c.commits)

    const answer = sorted.map(val => val.company)

    // Return undefined instead of an empty array
    return answer.length > 0 ? answer : undefined
  }
}

const getCompanyForUser = async (name, url) => {
  return await getOrSetFromCache(
    userCache,
    name,
    getCompanyForUserNoCache.bind(this, name, url)
  )
}

const getCompanyForUserNoCache = async (name, url) => {
  const ghBody = await tolerantFetch(url)

  const company = ghBody?.company

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
  return await getOrSetFromCache(
    companyCache,
    company,
    getCompanyFromGitHubLoginNoCache.bind(this, company)
  )
}

const getCompanyFromGitHubLoginNoCache = async company => {
  if (companyCache[company]) {
    return companyCache[company]
  } else {
    const url = `https://api.github.com/users/${company}`
    const ghBody = await tolerantFetch(url)

    let name = ghBody?.name

    // Some companies do not set a name, so just set the id in that case
    if (!name) {
      name = company
    }

    companyCache[company] = name

    return name
  }
}

// Useful for validating output
const dumpCache = () => {
  return repoCache
}

module.exports = {
  findSponsor,
  clearCaches,
  dumpCache,
  setMinimumContributorCount,
}
