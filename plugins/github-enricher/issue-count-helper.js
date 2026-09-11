const encodeUrl = require("encodeurl")
const { normaliseUrl } = require("./url-helper")
const { labelExtractor } = require("./labelExtractor")

const promiseRetry = require("promise-retry")

const followRedirect = require("follow-redirect-url")

const { queryGraphQl } = require("./github-helper")
const { ABSENT, isAbsent } = require("../../src/absent")
let getLabels

/* These checks hit github.com unauthenticated, so 429s are routine rather than exceptional. The
previous settings (5 retries, a 75 second minimum and a factor of 5) backed off to 75s, 375s, 1875s,
9375s and 46875s, so a single unlucky url could hold the build up for the best part of a day.
Keep the retries, but keep them to well under a minute in total.
 */
const RETRY_OPTIONS = { retries: 2, minTimeout: 10 * 1000, maxTimeout: 30 * 1000, factor: 3 }

// Neither url-exist nor follow-redirect-url takes a timeout, and a hung socket in either stalls the
// whole build
const URL_CHECK_TIMEOUT_MS = 15 * 1000

const URL_QUERY = "?q=is%3Aopen+is%3Aissue+"

const withTimeout = async (promise, fallback) => {
  let timer
  const timeout = new Promise(resolve => {
    timer = setTimeout(() => resolve(fallback), URL_CHECK_TIMEOUT_MS)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer)
  }
}


async function fetchScmLabel(artifactId) {
  // Special case extensions which live in the quarkus repo; in the future we could generalise,
  // but at the moment we only know how to find a label for quarkus

  // The getLabels function needs to be initialised, so check its there
  if (getLabels) {
    return getLabels(artifactId)
  }
}


function isQuarkusRepo(scmUrl) {
  return scmUrl === "https://github.com/quarkusio/quarkus"
}

const getIssueInformationNoCache = async (coords, artifactId, scmUrl) => {

  let graphqlQuery
  let urlSearchString = ""

  const shouldFindSubsetOfIssues = isQuarkusRepo(scmUrl)
  let totalCountAvailable = true

  if (shouldFindSubsetOfIssues) {

    const labels = await fetchScmLabel(artifactId)

    if (labels && labels.length > 0) {
      // TODO we can just treat label as an array, almost
      const graphqlSearchString = `, filterBy: { labels:  [${labels.map(label => `"${label}"`).join()}] }`
      graphqlQuery = `query {
          repository(owner:"${coords.owner}", name:"${coords.name}") {
            issues(states:OPEN ${graphqlSearchString}) {
                    totalCount
                  }
            }
        }`
      urlSearchString = URL_QUERY + "label%3A" +
        labels.map(label => label.replaceAll("/", "%2F")).join(",")
    } else {
      // The github search API automatically seems to count dashes as spaces, so no need to replaceAll dashes with spaces
      const shortArtifactId = artifactId.replaceAll("quarkus-", "")

      // We cannot use a filter in this case, instead we need to use the search endpoint
      totalCountAvailable = false
      graphqlQuery = `query SearchIssues {
  search(
    query: "repo:${coords.owner}/${coords.name} state:open is:issue in:body in:title ${shortArtifactId}"
    type: ISSUE
    first: 100
  ) {
    nodes {
      ... on Issue {
        number
      }
    }
  }
}`
      urlSearchString = URL_QUERY + "+in%3Abody+in%3Atitle+" + shortArtifactId
    }
  } else {
    graphqlQuery = `query {
          repository(owner:"${coords.owner}", name:"${coords.name}") {
            issues(states:OPEN) {
                    totalCount
                  }
            }
        }`
  }

  // TODO check pagination


  // Tolerate scm urls ending in .git, but don't try and turn them into issues urls without patching
  const topLevelIssuesUrl = scmUrl.replace(/\.git\/?$/, "")

  let issuesUrl = encodeUrl(topLevelIssuesUrl + "/issues" + urlSearchString)

  // Tidy double slashes
  issuesUrl = normaliseUrl(issuesUrl)


  // Batching this with other queries is not needed because rate limits are done on query complexity and cost,
  // not the number of actual http calls; see https://docs.github.com/en/graphql/overview/resource-limitations

  const body = graphqlQuery ? await queryGraphQl(graphqlQuery) : undefined

  // If the repository is gone, say so, so the answer gets cached and we stop asking every build
  if (isAbsent(body)) {
    return ABSENT
  }

  /* If GitHub did not answer at all, we know nothing: not the issue count, and not whether the
  issues url is any good. Give back nothing rather than an empty answer, so the failure stays out of
  the persisted cache and the next build tries again.

  It also stops us validating a url we know nothing about, which would mean an unauthenticated
  request to github.com for every affected extension. Those get 429ed, and the retries are what
  leaves a build apparently hung for hours.
   */
  if (!body) {
    return undefined
  }

  // The parent objects may be undefined and destructuring nested undefineds is not good
  // If we had to use a search, there's no total count field and we just have to count nodes
  const issues = totalCountAvailable ? body?.data?.repository?.issues?.totalCount : body?.data?.search?.nodes?.length

  issuesUrl = await maybeIssuesUrl(issues, issuesUrl)

  return { issues, issuesUrl }
}

const maybeIssuesUrl = async (issues, issuesUrl) => {
  if (issues && issues > 0) {
    return issuesUrl
  } else {
    // If we got an issue count we can be pretty confident our url will be ok, but otherwise, it might not be,
    // so check it. We don't check for every url because otherwise we start getting 429s and dropping good URLs
    // We have to access the url exist as a dynamic import (because CJS), await it because dynamic imports give a promise, and then destructure it to get the default
    // A simple property read won't work

    let urlExist
    try {
      const urlExistModule = await import("url-exist")
      urlExist = urlExistModule.default
    } catch (error) {
      // url-exist may fail to load in some environments (e.g., due to ky-universal ES module issues)
      // In this case, skip URL validation and return the URL as-is
      console.warn("Unable to load url-exist module, skipping URL validation:", error.message)
      return issuesUrl
    }

    console.log("Validating issue url for", issuesUrl, "because issues is", issues)

    // If the check times out, assume the url is fine rather than dropping a probably-good link
    const isValidUrl = await withTimeout(urlExist(issuesUrl), true)

    let isOriginalUrl = isValidUrl && (!await isRedirectToPulls(issuesUrl))

    return isOriginalUrl ? issuesUrl : undefined
  }
}

const isRedirectToPulls = async (issuesUrl) => {
  const check = promiseRetry(async (retry, number) => {
    // Being a valid url may not be enough, we also want to check for redirects to /pulls
    const urls = await followRedirect.startFollowing(issuesUrl)
    const finalUrl = urls[urls.length - 1]
    if (finalUrl.status === 429) {
      retry(new Error("Issues URL reports 429 on attempt " + number))
    }

    return (finalUrl.url.includes("/pulls"))
  }, RETRY_OPTIONS).catch(e => {
    // An unhandled rejection here would take the whole build down, and not knowing is not fatal
    console.warn("Could not check whether", issuesUrl, "redirects to pull requests -", e.message)
    return false
  })

  return await withTimeout(check, false)
}

const initialiseLabels = (yaml, repoListing) => {
  getLabels = labelExtractor(yaml, repoListing).getLabels
}


module.exports = { getIssueInformationNoCache, initialiseLabels }