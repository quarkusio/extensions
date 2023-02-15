const { default: parse } = require("mvn-artifact-name-parser")
const {
  createMavenUrlFromCoordinates,
  createMavenArtifactsUrlFromCoordinates,
} = require("./maven-url")
const axios = require("axios")
const promiseRetry = require("promise-retry")

const getTimestampFromMavenArtifactsListing = async maven => {
  const mavenArtifactsUrl = await createMavenArtifactsUrlFromCoordinates(maven)
  if (mavenArtifactsUrl) {
    const listingHeaders = await axios.head(mavenArtifactsUrl)
    const lastModified = listingHeaders.headers["last-modified"]
    return Date.parse(lastModified)
  } else {
    throw "Artifact url did not exist (probably temporarily)."
  }
}

const getTimestampFromMavenSearch = async maven => {
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
}

const tolerantlyGetTimestampFromMavenSearch = async maven => {
  return await promiseRetry(async () => getTimestampFromMavenSearch(maven), {
    retries: 6,
    factor: 3,
    minTimeout: 4 * 1000,
  }).catch(e => {
    // Don't even log 429 errors, they're kind of expected
    if (e.response?.status !== 429) {
      // We see 502 and other errors from maven, so handle failures gracefully
      console.warn("Could not fetch information from maven central", e)
    }
  })
}

const generateMavenInfo = async artifact => {
  const maven = parse(artifact)
  const mavenUrl = await createMavenUrlFromCoordinates(maven)

  if (mavenUrl) {
    maven.url = mavenUrl
  }

  let timestamp
  // This will be slow because we need to need hit the endpoint too fast and we need to back off; we perhaps should batch, but that's hard to implement with our current model
  // We should perhaps also consider a soft-cache locally for when we fail completely
  try {
    timestamp = await getTimestampFromMavenArtifactsListing(maven)
  } catch (e) {
    console.log(
      "Could not get timestamp from repository folder, querying maven directly."
    )
    console.log("Error is:", e)
    timestamp = tolerantlyGetTimestampFromMavenSearch(maven)
  }
  maven.timestamp = await timestamp

  return maven
}
module.exports = { generateMavenInfo }
