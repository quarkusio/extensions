const { default: parse } = require("mvn-artifact-name-parser")
const { createMavenUrlFromCoordinates } = require("./maven-url")
const axios = require("axios")
const promiseRetry = require("promise-retry")

const generateMavenInfo = async artifact => {
  const maven = parse(artifact)
  const mavenUrl = await createMavenUrlFromCoordinates(maven)
  if (mavenUrl) {
    maven.url = mavenUrl
  }

  // This will be slow because we need to need hit the endpoint too fast and we need to back off; we perhaps should batch, but that's hard to implement with our current model
  // We should perhaps also consider a soft-cache locally for when we fail completely
  const timestamp = await promiseRetry(
    async () => {
      const response = await axios.get(
        "https://search.maven.org/solrsearch/select",
        {
          params: {
            q: `g:${maven.groupId} AND a:${maven.artifactId} AND v:${maven.version}`,
            rows: 20,
            wt: "json",
          },
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "UTF-8",
          },
        }
      )
      const { data } = response
      return data?.response?.docs[0]?.timestamp
    },
    { retries: 6, factor: 3, minTimeout: 4 * 1000 }
  ).catch(e => {
    // Don't even log 429 errors, they're kind of expected
    if (e.response?.status !== 429) {
      // We see 502 and other errors from maven, so handle failures gracefully
      console.warn("Could not fetch information from maven central", e)
    }
  })

  // Error tolerance; make sure something get sets even if maven central is playing up
  maven.timestamp = timestamp ? timestamp : 0

  return maven
}
module.exports = { generateMavenInfo }
