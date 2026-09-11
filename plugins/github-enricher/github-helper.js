const promiseRetry = require("promise-retry")
const { ABSENT, isAbsent } = require("../../src/absent")

// The pause before a retry is long because GitHub's secondary rate limiter wants a long pause, but
// it has to be bounded; with no maxTimeout, a factor of 3 runs away and one bad query can hold a
// build up for a quarter of an hour.
const RETRY_OPTIONS = { retries: 3, minTimeout: 75 * 1000, maxTimeout: 5 * 60 * 1000, factor: 3 }

// No single request should be able to hang the build. Without this, a stalled socket waits for ever
// and the gatsby spinner sits on "source and transform nodes" with nothing to say why.
const REQUEST_TIMEOUT_MS = 30 * 1000

const PAGE_INFO_SUBQUERY = "pageInfo {\n" +
  "      hasNextPage\n" +
  "      endCursor\n" +
  "    }\n" +
  "    edges {"

const RATE_LIMIT_PREQUERY = `rateLimit {
    limit
    cost
    remaining
    resetAt
  }`

let resetTime
const allowSlowBuild = !process.env.DONT_WAIT

/* A whole-build budget for talking to GitHub.

Once it is spent we stop making requests, and the build finishes with whatever we managed to gather.
That is not a loss: everything we did fetch is still written to the cache, so each build picks up
where the last one left off and the cache warms up over a few runs instead of one very long one.

CI builds want complete data and have the rate limit to themselves, so they get no budget by
default. Set GITHUB_BUDGET_MINUTES to override, or to 0 to remove the budget entirely.
 */
const DEFAULT_BUDGET_MINUTES = process.env.CI ? 0 : 20
const budgetMinutes = process.env.GITHUB_BUDGET_MINUTES !== undefined
  ? Number(process.env.GITHUB_BUDGET_MINUTES)
  : DEFAULT_BUDGET_MINUTES
const budgetMs = budgetMinutes > 0 ? budgetMinutes * 60 * 1000 : undefined
let buildStart = Date.now()

// The module is only loaded once, but a develop session bootstraps more than once, and each
// bootstrap should get its own budget rather than inheriting an exhausted one
const startGitHubBudget = () => {
  buildStart = Date.now()
  alreadyWarned.clear()
}

const remainingBudget = () => budgetMs ? budgetMs - (Date.now() - buildStart) : Infinity

const isOutOfBudget = () => {
  if (remainingBudget() > 0) {
    return false
  }
  warnOnce(`Spent the ${budgetMinutes} minute GitHub budget for this build, so skipping the remaining GitHub queries. Everything fetched so far has been cached, so the next build will get further. Set GITHUB_BUDGET_MINUTES to change the budget, or to 0 to remove it.`)
  return true
}

// A dead repository is referenced by every extension that lives in it, and each one produces the
// same complaint. Saying it once is enough, and keeps the useful warnings visible.
const alreadyWarned = new Set()
const warnOnce = message => {
  if (!alreadyWarned.has(message)) {
    alreadyWarned.add(message)
    console.warn(message)
  }
}

/* GitHub reports a repository that is missing, private, or renamed as a NOT_FOUND error alongside a
null in the data. That is a permanent answer rather than a blip, so it is worth remembering:
retrying it burns rate limit, and re-asking on every build is how a handful of dead repositories
come to dominate the build.
 */
const isNotFound = ghBody => {
  const errors = ghBody?.errors
  if (Array.isArray(errors) && errors.length > 0) {
    return errors.every(error => error?.type === "NOT_FOUND")
  }
  // The REST api says it more briefly
  return ghBody?.message === "Not Found"
}

// jsdom, which the tests run in, does not always have AbortSignal.timeout
const timeoutSignal = () =>
  typeof AbortSignal !== "undefined" ? AbortSignal.timeout?.(REQUEST_TIMEOUT_MS) : undefined

// We can add more errors we know are non-recoverable here, which should help build times
const isRecoverableError = (ghBody, params) => {
  const contents = JSON.stringify(ghBody)
  if (contents.includes("Parse error")) {
    console.warn("Parse error on ", params)
    console.warn("Error is", ghBody)
    return false
  } else if (isNotFound(ghBody)) {
    return false
  } else if (contents.includes("Something went wrong while executing your query")) {
    console.warn("Mystery error for ", params)
    console.warn("Error is", ghBody)
  }
  return true
}


async function tolerantFetch(url, params, isSuccessful, getContents) {
  const accessToken = process.env.GITHUB_TOKEN

  if (accessToken) {
    if (isOutOfBudget()) {
      return undefined
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    }
    const body = await promiseRetry(
      async retry => {
        const res = await fetch(url, { ...params, headers, signal: timeoutSignal() }).catch(e => retry(e))
        const ghBody = await getContents(res)
        resetTime = ghBody?.data?.rateLimit?.resetAt || resetTime

        if (!isSuccessful(ghBody) && isRecoverableError(ghBody, params)) {
          const responseString = JSON.stringify(ghBody)

          if (allowSlowBuild && responseString?.includes("RATE_LIMITED") && resetTime) {
            console.warn("Hit the rate limit. Waiting until", resetTime)
            await waitUntil(resetTime)
          }
          if (allowSlowBuild) {
            retry(
              `Unsuccessful GitHub fetch for ${url} - response is ${responseString}`
            )
          }
        }
        return ghBody
      },
      RETRY_OPTIONS
    ).catch(e => {
      // Do not break the build for this, warn and carry on
      console.warn(e)
      return undefined
    })

    // A definitive "this does not exist" is an answer, and callers cache it so we stop asking
    if (isNotFound(body)) {
      const detail = body?.errors?.map(error => error?.message).join(" ") || `${url} was not found`
      warnOnce(`GitHub does not have this, so no information will be shown for it: ${detail}`)
      return ABSENT
    }

    if (body?.errors || body?.message) {
      console.warn(
        `Could not get GitHub information for ${url} - response is ${JSON.stringify(
          body
        )}`
      )
      return undefined
    }

    return body
  } else {
    console.warn(
      "Cannot read contributor information, because the environment variable `GITHUB_TOKEN` has not been set."
    )
  }
}

function findPaginatedElements(data, name, inPath) {
  let currentPath = inPath || []
  let contents

  let answer

  for (let key in data) {
    if (key === name) {
      contents = data[key]
      break
    } else if (typeof data[key] == "object") {
      currentPath.push(key)
      answer = findPaginatedElements(data[key], name, currentPath)
      if (answer) {
        contents = answer.contents
        break
      } else {
        currentPath.pop(key)
      }
    }
  }

  if (contents) {
    return { keys: currentPath, contents }
  }
}

/*
* Note: Fiddliness ahead!
* This will invoke GitHub pagination, if the query includes an edges element.
* If there's more than one edges element, I think it would paginate the first, but I haven't tested.
 */
const queryGraphQl = async (query) => {

  const amendedQuery = query.replace(/edges\s*{/, PAGE_INFO_SUBQUERY).replace("query {", "query {" + RATE_LIMIT_PREQUERY)

  const answer = await tolerantFetch("https://api.github.com/graphql", {
      method: "POST",
      body: JSON.stringify({ query: amendedQuery })
    },
    (ghBody) => ghBody?.data
    , res => res && res.json()
  )

  // Nothing to paginate through if the repository is not there
  if (isAbsent(answer)) {
    return answer
  }

  const paginatedElements = findPaginatedElements(answer?.data, "pageInfo")

  // If we find a next page cursor, we go again!
  const recursedData = paginatedElements && paginatedElements.contents?.hasNextPage && await recurse(query, paginatedElements)
  if (recursedData) {
    const pathElements = paginatedElements.keys
    // Unroll the path into the json object
    const answerHolder = pathElements.reduce((accumulator, currentValue) => accumulator[currentValue], answer?.data)

    if (answerHolder) {
      answerHolder.edges = answerHolder.edges.concat(recursedData.edges)
    }
  }

  // If we didn't get to the end of the pages, do not return any data
  if (paginatedElements && paginatedElements.contents?.hasNextPage && !recursedData) {
    console.warn("Could not read all pages for GitHub query.")
    return undefined
  }

  return answer
}

const recurse = async (query, paginatedElements) => {

  const pageInfo = paginatedElements.contents
  const pathElements = paginatedElements.keys
  const fieldName = pathElements[pathElements.length - 1]

  const endCursor = pageInfo?.endCursor
  // If there are existing parentheses, just pop our amendment in there
  // Also overwrite any previous 'after' clauses
  const fieldNamePlusAfter = new RegExp(fieldName + "\\s*\\(after: [^,\\)]+", "gi")
  const fieldNamePlusParentheses = new RegExp(fieldName + "\\s*\\(", "gi")

  // This is complicated logic, and regex. On the bright side, there are tests to help a simplifying refactor.
  let nextPageQuery
  if (query.match(fieldNamePlusAfter)) {
    nextPageQuery = query.replace(fieldNamePlusAfter, `${fieldName}(after: "${endCursor}"`)
  } else if (query.match(fieldNamePlusParentheses)) {
    nextPageQuery = query.replace(fieldNamePlusParentheses, `${fieldName}(after: "${endCursor}", `)
  } else {
    nextPageQuery = query.replace(fieldName, `${fieldName}(after: "${endCursor}")`)
  }

  // Sense check - if we didn't manage to insert the end cursor into the query, do not go on or we will recurse infinitely
  if (!nextPageQuery.includes(endCursor)) {
    console.error("Could not find the right place to put the pagination cursor in ", nextPageQuery, "\nLooked for field name", fieldName)
  }

  // Do the check as a one-liner so the async works properly
  const supplemental = nextPageQuery.includes(endCursor) && await queryGraphQl(nextPageQuery)

  // If the rate limiter hit, we may not have data
  if (supplemental?.data) {
    // Unroll the path into the json object
    return pathElements.reduce((accumulator, currentValue) => accumulator[currentValue], supplemental?.data)
  }
}

const queryRest = async (path) => {
  return await tolerantFetch(`https://api.github.com/${path}`, {
      method: "GET",
    },
    (ghBody) => ghBody,
    res => res && res.json()
  )

}

const waitUntil = async (timeString) => {
  const targetTime = new Date(timeString)
  const delta = targetTime - Date.now()

  if (delta <= 0) {
    return
  }

  // Waiting out the rate limiter can take the best part of an hour. If that would take us past the
  // build's budget there is no point sleeping through it; give up on the remaining GitHub data now
  // and let the build finish.
  if (delta > remainingBudget()) {
    warnOnce("Hit the rate limit, and waiting for it to reset would take longer than this build's remaining GitHub budget. Carrying on without the rest of the GitHub data.")
    return
  }

  return new Promise(resolve => {
    setTimeout(resolve, delta)
  })
}

const getRawFileContents = async (org, repo, path) => {
  // Don't consolidate these two lines or we risk replacing the double slash in http://
  const fullPath = `raw.githubusercontent.com/${org}/${repo}/main/${path}`.replace("//", "/")
  const url = "https://" + fullPath

  return await tolerantFetch(url, {
    method: "GET",
  }, ghBody => ghBody, res => res && res.text())

}

module.exports = { queryGraphQl, queryRest, getRawFileContents, startGitHubBudget }