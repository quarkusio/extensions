import encodeUrl from "encodeurl"
import { normaliseUrl } from "./url-helper"

const promiseRetry = require("promise-retry")

const followRedirect = require("follow-redirect-url")

const { queryGraphQl } = require("./github-helper")

const RETRY_OPTIONS = { retries: 5, minTimeout: 75 * 1000, factor: 5 }

const getIssueInformationNoCache = async (coords, labels, scmUrl) => {

  // TODO we can just treat label as an array, almost
  const labelFilterString = labels
    ? `, filterBy: { labels:  [${labels.map(label => `"${label}"`).join()}] }`
    : ""

  // Tolerate scm urls ending in .git, but don't try and turn them into issues urls without patching
  const topLevelIssuesUrl = (scmUrl + "/issues").replace("\.git/issues", "/issues")
  console.log("toss", topLevelIssuesUrl)
  let issuesUrl = labels
    ? encodeUrl(
      scmUrl +
      "/issues?q=is%3Aopen+is%3Aissue+label%3A" +
      labels.map(label => label.replace("/", "%2F")).join(",")
    )
    : topLevelIssuesUrl

  console.log("pruss", issuesUrl)

  // Tidy double slashes
  issuesUrl = normaliseUrl(issuesUrl)


  // Batching this with other queries is not needed because rate limits are done on query complexity and cost,
  // not the number of actual http calls; see https://docs.github.com/en/graphql/overview/resource-limitations
  const query = `query {
          repository(owner:"${coords.owner}", name:"${coords.name}") {
            issues(states:OPEN, ${labelFilterString}) {
                    totalCount
                  }
                }
        }`

  const body = query ? await queryGraphQl(query) : undefined

  // The parent objects may be undefined and destructuring nested undefineds is not good
  const issues = body?.data?.repository?.issues?.totalCount

  console.log("uss", issuesUrl)
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


module.exports = { getIssueInformationNoCache }