const encodeUrl = require("encodeurl")
const { normaliseUrl } = require("./url-helper")
const { labelExtractor } = require("./labelExtractor")

const promiseRetry = require("promise-retry")

const followRedirect = require("follow-redirect-url")

const { queryGraphQl } = require("./github-helper")
let getLabels

const RETRY_OPTIONS = { retries: 5, minTimeout: 75 * 1000, factor: 5 }
const URL_QUERY = "?q=is%3Aopen+is%3Aissue+"


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
  const topLevelIssuesUrl = scmUrl.replace(/.git\/?$/, "")

  let issuesUrl = encodeUrl(topLevelIssuesUrl + "/issues" + urlSearchString)

  // Tidy double slashes
  issuesUrl = normaliseUrl(issuesUrl)


  // Batching this with other queries is not needed because rate limits are done on query complexity and cost,
  // not the number of actual http calls; see https://docs.github.com/en/graphql/overview/resource-limitations

  const body = graphqlQuery ? await queryGraphQl(graphqlQuery) : undefined

  // The parent objects may be undefined and destructuring nested undefineds is not good
  // If we had to use a search, there's no total count field and we just have to count nodes
  const issues = totalCountAvailable ? body?.data?.repository?.issues?.totalCount : body.data.search.nodes.length

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
    const {
      default: urlExist,
    } = await import("url-exist")

    console.log("Validating issue url for", issuesUrl, "because issues is", issues)

    const isValidUrl = await urlExist(issuesUrl)

    let isOriginalUrl = isValidUrl && (!await isRedirectToPulls(issuesUrl))

    return isOriginalUrl ? issuesUrl : undefined
  }
}

const isRedirectToPulls = async (issuesUrl) => {
  return await promiseRetry(async (retry, number) => {
    // Being a valid url may not be enough, we also want to check for redirects to /pulls
    const urls = await followRedirect.startFollowing(issuesUrl)
    const finalUrl = urls[urls.length - 1]
    if (finalUrl.status === 429) {
      retry(new Error("Issues URL reports 429 on attempt " + number))
    }

    return (finalUrl.url.includes("/pulls"))
  }, RETRY_OPTIONS)
}

const initialiseLabels = (yaml, repoListing) => {
  getLabels = labelExtractor(yaml, repoListing).getLabels
}


module.exports = { getIssueInformationNoCache, initialiseLabels }