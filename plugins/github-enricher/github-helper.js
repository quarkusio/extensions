const promiseRetry = require("promise-retry")
const RETRY_OPTIONS = { retries: 3, minTimeout: 75 * 1000, factor: 3 }
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

// We can add more errors we know are non-recoverable here, which should help build times
const isRecoverableError = (ghBody, params) => {
  const contents = JSON.stringify(ghBody)
  if (contents.includes("Parse error")) {
    console.warn("Parse error on ", params)
    console.warn("Error is", ghBody)
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
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    }
    const body = await promiseRetry(
      async retry => {
        const res = await fetch(url, { ...params, headers }).catch(e => retry(e))
        const ghBody = await getContents(res)
        resetTime = ghBody?.data?.rateLimit?.resetAt || resetTime

        if (!isSuccessful(ghBody) && isRecoverableError(ghBody, params)) {
          const responseString = JSON.stringify(ghBody)

          if (responseString?.includes("RATE_LIMITED") && resetTime) {
            console.warn("Hit the rate limit. Waiting until", resetTime)
            await waitUntil(resetTime)
          }
          retry(
            `Unsuccessful GitHub fetch for ${url} - response is ${responseString}`
          )
        }
        return ghBody
      },
      RETRY_OPTIONS
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

module.exports = { queryGraphQl, queryRest, getRawFileContents }