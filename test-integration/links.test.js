jest.setTimeout(5 * 60 * 1000)

const link = require("linkinator")
const status = require("http-status")
const { curly } = require("node-libcurl")
const promiseRetry = require("promise-retry")

const config = require("../gatsby-config.js")

describe("site links", () => {
  const deadExternalLinks = []
  const deadInternalLinks = []

  beforeAll(async () => {
    const path = "http://localhost:9000"

    // create a new `LinkChecker` that we'll use to run the scan.
    const checker = new link.LinkChecker()

    // After a page is scanned, check out the results!
    checker.on("link", async result => {
      if (result.state === "BROKEN") {
        // Don't stress about 403s from vimeo because humans can get past the paywall fairly easily and we want to have the link
        const isPaywalled =
          result.status === status.FORBIDDEN && result.url.includes("vimeo")

        let retryWorked
        if (result.url.includes("twitter")) {
          // Twitter gives 404s, I think if it feels bombarded, so let's try a retry
          retryWorked = await retryUrl(result.url)
        }
        if (!retryWorked && !isPaywalled) {
          const errorText =
            result.failureDetails[0].statusText || result.failureDetails[0].code
          const description = `${result.url} => ${result.status} (${errorText}) on ${result.parent}`
          if (result.url.includes(path)) {
            // This will still miss links where the platform uses the configured url to make it an absolute path, but hopefully we don't care
            // too much about the categorisation as long as *a* break happens
            if (!deadInternalLinks.includes(description)) {
              deadInternalLinks.push(description)
            }
          } else {
            if (!deadExternalLinks.includes(description)) {
              deadExternalLinks.push(description)
            }
          }
        }
      }
    })

    const linksToSkip = [
      "https://twitter.com/quarkusio",
      // TODO remove these exemptions as soon as new releases with live guide links are made (the repos are correct, the releases are not)
      "https://quarkus.io/guides/freemarker",
      "https://quarkus.io/guides/qson",
      "https://quarkus.io/guides/azure-functions", // https://github.com/quarkusio/quarkus/issues/31148
      "https://camel.apache.org/camel-quarkus/latest/reference/extensions/tagsoup.html", // https://github.com/apache/camel-quarkus/issues/4620
      "https://camel.apache.org/camel-quarkus/latest/reference/extensions/ipfs.html", // https://github.com/apache/camel-quarkus/issues/4621
      "https://camel.apache.org/camel-quarkus/latest/reference/extensions/weka.html", //https://github.com/apache/camel-quarkus/issues/4622
      "https://quarkus.io/guides/amazon-cognitouserpools", //https://github.com/quarkiverse/quarkus-amazon-services/issues/577
    ]

    // Go ahead and start the scan! As events occur, we will see them above.
    return await checker.check({
      path,
      recurse: true,
      linksToSkip,
      urlRewriteExpressions: [
        {
          pattern: config.siteUrl,
          replacement: "http://localhost:9000",
        },
      ],
      concurrency: 5,
      timeout: 30 * 1000,
      retryErrors: true,
      retryErrorsCount: 6,
    })
  })

  it("internal links should all resolve", async () => {
    expect(deadInternalLinks).toEqual([])
  })

  it("external links should all resolve", async () => {
    expect(deadExternalLinks).toEqual([])
  })
})

const retryUrl = async url => {
  const hitUrl = async retry => {
    // Use a different client, which seems less affected by the 404s from twitter
    const { statusCode } = await curly.get(url)

    if (status[`${statusCode}_CLASS`] !== status.classes.SUCCESSFUL) {
      return retry(statusCode)
    }
  }
  return promiseRetry(hitUrl, { retries: 4, minTimeout: 4 * 1000 })
    .then(() => true)
    .catch(() => false)
}
