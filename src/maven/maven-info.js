const { default: parse } = require("mvn-artifact-name-parser")
const {
  createMavenUrlFromCoordinates,
  createMavenPomUrlFromCoordinates,
  createMavenMetadataUrlFromCoordinates
} = require("./maven-url")
const axios = require("axios")
const promiseRetry = require("promise-retry")
const { readPom } = require("./pom-reader")
const PersistableCache = require("../persistable-cache")
const xml2js = require("xml2js")
const parser = new xml2js.Parser({ explicitArray: false, trim: true })

const DAY_IN_SECONDS = 60 * 60 * 24

let timestampCache, versionCache, pomCache

// Mirror-aware axios :)
const maxios = {
  get: (url, config) => {
    try {
      return axios.get(url, config)
    } catch (e) {
      // Fallback to the google mirror
      console.log("Falling back to google mirror for", url, "because of", e)
      const mirrorUrl = url.replace("repo1.maven.org", "maven-central.storage-download.googleapis.com")
      return axios.get(mirrorUrl, config)
    }
  }, head: (url, config) => {
    try {
      return axios.head(url, config)
    } catch (e) {
      // Fallback to the google mirror
      const mirrorUrl = url.replace("repo1.maven.org", "maven-central.storage-download.googleapis.com")
      return axios.head(mirrorUrl, config)
    }
  }
}

const initMavenCache = async () => {
  // If there are problems with the cache, it works well to add something like pomCache.flushAll() on a main-branch build
  // (and then remove it next build)

  timestampCache = new PersistableCache({
    key: "maven-api-for-timestamps",
    stdTTL: 5 * DAY_IN_SECONDS
  })
  pomCache = new PersistableCache({
    key: "maven-api-for-latest-poms",
    stdTTL: 5 * DAY_IN_SECONDS // released poms are unlikely to change
  })
  versionCache = new PersistableCache({
    key: "maven-api-for-latest-versions",
    stdTTL: .5 * DAY_IN_SECONDS // versions do change often, and if this is wrong we may miss new relocations
  })

  await pomCache.ready()
  console.log("Ingested cached maven information for", pomCache.size(), "artifacts.")
  await timestampCache.ready()
  console.log("Ingested cached timestamp information for", timestampCache.size(), "maven artifacts.")
  await versionCache.ready()
}

const clearMavenCache = () => {
  timestampCache?.flushAll()
  pomCache?.flushAll()
  versionCache?.flushAll()
}

const saveMavenCache = () => {
  timestampCache?.persist()
  pomCache?.persist()
  versionCache?.persist()
}

const getTimestampFromMavenArtifactsListing = async maven => {
  const mavenArtifactsUrl = await createMavenPomUrlFromCoordinates(maven)
  if (mavenArtifactsUrl) {
    const listingHeaders = await maxios.head(mavenArtifactsUrl)
    // If we went for the mirror, timestamps in the mirror will be wrong, but x-goog-meta-last-modified will be correct

    const lastModified = listingHeaders.headers["x-goog-meta-last-modified"] || listingHeaders.headers["last-modified"]
    return Date.parse(lastModified)
  } else {
    throw new Error("Artifact url did not exist (probably temporarily).")
  }
}

const getTimestampFromMavenSearch = async maven => {
  const response = await maxios.get(
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
  return await promiseRetry(async (retry) => getTimestampFromMavenSearch(maven).catch(retry), {
    retries: 6,
    factor: 3,
    minTimeout: 4 * 1000,
  }).catch(e => {
    // Don't even log 429 and 403 errors, they're kind of expected
    if (e.response?.status !== 429 || e.response?.status !== 403) {
      // We see 502 and other errors from maven, so handle failures gracefully
      console.warn("Could not fetch timestamp information from maven search", e)
    } else {
      console.warn("Could not fetch timestamp information from maven search")
    }
  })
}

const getLatestVersionFromMavenMetadata = async (groupId, artifactId) => {
  const url = await createMavenMetadataUrlFromCoordinates({ groupId, artifactId })
  if (url) {
    const response = await maxios.get(url)
    const { data } = response
    // Note that this parser returns a promise, so needs an await on the other side
    const raw = await parser.parseStringPromise(data)
    return raw?.metadata?.versioning?.release
  }
}

const tolerantlyGetLatestVersionFromMavenMetadata = async (groupId, artifactId) => {
  return await promiseRetry(async (retry) => getLatestVersionFromMavenMetadata(groupId, artifactId).catch(retry), {
    retries: 6,
    factor: 3,
    minTimeout: 4 * 1000,
  }).catch(e => {
    // Don't even log 429 errors, they're kind of expected
    if (e.response?.status !== 429 || e.response?.status !== 429) {
      // We see 502 and other errors from maven, so handle failures gracefully
      console.warn("Could not fetch version information from maven central")
    } else {
      console.warn("Could not fetch version information from maven central", e)
    }
  })
}

const getRelocation = async (coordinates) => {
  const { groupId, artifactId } = coordinates

  // We need to check either the most recent version, or at the very least, one *after* the one in the registry
  // The version of the artifact in the registry will *not* have a relocation in its pom, because it will be the last one pre-relocation
  const version = await versionCache.getOrSet(groupId + artifactId, async () => await tolerantlyGetLatestVersionFromMavenMetadata(groupId, artifactId))

  // If the version in the registry is the same as the latest version up on maven central, there can't be an active relocation for this artifact
  if (version !== coordinates.version) {

    const url = await createMavenPomUrlFromCoordinates({ groupId, artifactId, version })

    if (url) {
      const options = {
        retries: 6,
        factor: 3,
        minTimeout: 4 * 1000,
      }

      const data = await pomCache.getOrSet(url, async () => {
          try {
            const response = await promiseRetry(async (retry) => maxios.get(url, {}).catch(retry), options)
            return response.data
          } catch (error) {
            console.warn("Tried to read", url, "Error made it through the mirror fallback and the promise retry", error)
          }
        }
      )


      if (data) {
        const processed = await readPom(data)

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
    }
  }
}

const generateMavenInfo = async artifact => {
  const maven = parse(artifact)

  const mavenUrl = await createMavenUrlFromCoordinates(maven)

  if (mavenUrl) {
    maven.url = mavenUrl
  }

  maven.relocation = await getRelocation(maven)


  let timestamp = await timestampCache.getOrSet(artifact, async () => {
    // This will be slow because we need to need hit the endpoint too fast and we need to back off; we perhaps should batch, but that's hard to implement with our current model
    let thing
    try {
      thing = await getTimestampFromMavenArtifactsListing(maven)
    } catch (e) {
      console.log(
        "Could not get timestamp from repository folder, querying maven directly."
      )
      thing = await tolerantlyGetTimestampFromMavenSearch(maven)
    }
    return thing
  })

  maven.timestamp = await timestamp


  return maven
}

module.exports = {
  generateMavenInfo,
  clearMavenCache,
  initMavenCache,
  getLatestVersionFromMavenMetadata,
  saveMavenCache
}
