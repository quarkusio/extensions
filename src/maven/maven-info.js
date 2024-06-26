const { default: parse } = require("mvn-artifact-name-parser")
const {
  createMavenUrlFromCoordinates,
  createMavenArtifactsUrlFromCoordinates
} = require("./maven-url")
const axios = require("axios")
const promiseRetry = require("promise-retry")
const { readPom } = require("./pom-reader")
const PersistableCache = require("../persistable-cache")

const DAY_IN_SECONDS = 60 * 60 * 24

let timestampCache, latestVersionCache

const initMavenCache = async () => {
  // If there are problems with the cache, it works well to add something like latestVersionCache.flushAll() on a main-branch build
  // (and then remove it next build)

  timestampCache = new PersistableCache({
    key: "maven-api-for-timestamps",
    stdTTL: 5 * DAY_IN_SECONDS
  })
  latestVersionCache = new PersistableCache({
    key: "maven-api-for-latest-versions",
    stdTTL: 5 * DAY_IN_SECONDS // the worst that happens if this is out of of date is we do one extra query to read the pom
  })

  await latestVersionCache.ready()
  console.log("Ingested cached maven information for", latestVersionCache.size(), "artifacts.")
  await timestampCache.ready()
  console.log("Ingested cached timestamp information for", timestampCache.size(), "maven artifacts.")
}

const clearMavenCache = () => {
  timestampCache?.flushAll()
  latestVersionCache?.flushAll()
}

const getTimestampFromMavenArtifactsListing = async maven => {
  const mavenArtifactsUrl = await createMavenArtifactsUrlFromCoordinates(maven)
  if (mavenArtifactsUrl) {
    const listingHeaders = await axios.head(mavenArtifactsUrl)
    const lastModified = listingHeaders.headers["last-modified"]
    return Date.parse(lastModified)
  } else {
    throw new Error("Artifact url did not exist (probably temporarily).")
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

const getLatestVersionFromMavenSearch = async (groupId, artifactId) => {
  const response = await axios.get(
    "https://search.maven.org/solrsearch/select",
    {
      params: {
        q: `g:${groupId} AND a:${artifactId}`,
        rows: 1,
        wt: "json",
      },
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "UTF-8",
      },
    }
  )
  const { data } = response
  return data?.response?.docs[0]?.latestVersion
}

const tolerantlyGetLatestVersionFromMavenSearch = async (groupId, artifactId) => {
  return await promiseRetry(async () => getLatestVersionFromMavenSearch(groupId, artifactId), {
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

const getRelocation = async (artifact, groupId, artifactId) => {
  const latestVersion = await latestVersionCache.getOrSet(artifact, () => tolerantlyGetLatestVersionFromMavenSearch(groupId, artifactId))

  if (latestVersion) {
    const latestPomUrl = await createMavenArtifactsUrlFromCoordinates({
      artifactId,
      groupId,
      version: latestVersion
    })

    const options = {
      retries: 6,
      factor: 3,
      minTimeout: 4 * 1000,
    }

    try {
      const data = await latestVersionCache.getOrSet(latestPomUrl, async () => {
          const response = await promiseRetry(async () => axios.get(latestPomUrl, {}), options)
          return response.data
        }
      )

      if (data) {
        const processed = await promiseRetry(async () => readPom(data), options)

        const relocation = processed.relocation

        // Sometimes a relocation stanza might be missing a group id or artifact id, so fill in gaps
        if (relocation) {
          if (!relocation.artifactId) {
            relocation.artifactId = artifactId
          }
          if (!relocation.groupId) {
            relocation.groupId = groupId
          }
        }
        return relocation
      }
    } catch (error) {
      console.warn("Tried to read", latestPomUrl, "Error made it through the promise retry", error)
    }
  }
}

const generateMavenInfo = async artifact => {
  const maven = parse(artifact)

  const mavenUrl = await createMavenUrlFromCoordinates(maven)

  if (mavenUrl) {
    maven.url = mavenUrl
  }

  maven.relocation = await getRelocation(artifact, maven.groupId, maven.artifactId)


  let timestamp = await timestampCache.getOrSet(artifact, async () => {
    // This will be slow because we need to need hit the endpoint too fast and we need to back off; we perhaps should batch, but that's hard to implement with our current model
    let thing
    try {
      thing = await getTimestampFromMavenArtifactsListing(maven)
    } catch (e) {
      console.log(
        "Could not get timestamp from repository folder, querying maven directly."
      )
      console.log("Error is:", e)
      thing = await tolerantlyGetTimestampFromMavenSearch(maven)
    }
    return thing
  })

  maven.timestamp = await timestamp


  return maven
}
module.exports = { generateMavenInfo, clearMavenCache, initMavenCache }
