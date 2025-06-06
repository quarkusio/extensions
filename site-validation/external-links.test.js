jest.setTimeout(120 * 60 * 1000)

const link = require("linkinator")
const status = require("http-status")
const { curly } = require("node-libcurl")
const promiseRetry = require("promise-retry")
const fs = require("fs/promises")
const config = require("../gatsby-config.js")
const { port } = require("../jest-puppeteer.config").server

const pathPrefix = process.env.PATH_PREFIX || ""

describe("site external links", () => {
  const deadExternalLinks = []
  const deadInternalLinks = []

  const resultsFile = "dead-link-check-results.json"

  beforeAll(async () => {
    await fs.rm(resultsFile, { force: true })

    const path = `http://localhost:${port}/${pathPrefix}`
    const pendingRetries = []

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
          pendingRetries.push(retryWorked)
        }

        if (result.status === status.TOO_MANY_REQUESTS) {
          // Twitter gives 404s, I think if it feels bombarded, so let's try a retry
          retryWorked = await retryUrl(result.url)
          pendingRetries.push(retryWorked)
        }

        // Some APIs give 429s but no retry-after header, and linkinator will not retry in that case
        // However, retrying all those links can make the build epically slow, and a true 404 would turn up on a subsequent run, so err on the side of assuming the links are valid

        if (!retryWorked) {
          if (result.status === status.TOO_MANY_REQUESTS) {
            console.log("Giving a pass because of too many tries to", result)
          } else if (isPaywalled) {
            console.log("Giving a pass to paywalled link", result)
          } else {
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

                // Also write out to a file - the a+ flag will create it if it doesn't exist
                const content = JSON.stringify({ url: result.url, owningPage: result.parent }) + "\n"

                const write = await fs.writeFile(resultsFile, content, { flag: "a+" }, err => {
                  console.warn("Error writing results:", err)
                })
                pendingRetries.push(write)
              }
            }
          }
        }

        return retryWorked
      }
    })

    const linksToSkip = [
      "https://twitter.com/quarkusio",
    ]

    // Go ahead and start the scan! As events occur, we will see them above.
    return checker.check({
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
      retry: true, // Retry on 429
      retryErrors: true, // Retry on 5xx
      retryErrorsCount: 12,
      retryErrorsJitter: 8000, // Default is 3000
    })
      .then(() => Promise.all(pendingRetries))
  })


  it("external links should all resolve", async () => {
    expect(deadExternalLinks).toEqual([])
  })
})

const retryUrl = async url => {
  const hitUrl = async retry => {
    // Use a different client, which allows us to retry many times for 429s
    const { statusCode } = await curly.get(url)

    if (status[`${statusCode}_CLASS`] !== status.classes.SUCCESSFUL) {
      return retry(statusCode)
    }
  }
  return promiseRetry(hitUrl, { retries: 3, minTimeout: 80 * 1000 })
    .then(() => true)
    .catch(() => false)
}
