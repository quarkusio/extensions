const parse = require("mvn-artifact-name-parser").default
const PersistableCache = require("../persistable-cache")

const DAY_IN_SECONDS = 60 * 60 * 24

let mavenUrlCache

const initMavenUrlCache = async () => {
  mavenUrlCache = new PersistableCache({
    key: "maven-url-existence",
    stdTTL: 30 * DAY_IN_SECONDS
  })
  await mavenUrlCache.ready()
  console.log("Ingested cached information for", mavenUrlCache.size(), "maven urls.")
}

const saveMavenUrlCache = async () => {
  await mavenUrlCache.persist()
}

const createMavenUrlFromArtifactString = async artifact => {
  // Do some light pre-checking so we don't have to deal with catching
  if (artifact && artifact.includes(":")) {
    const coordinates = parse(artifact)
    return createMavenUrlFromCoordinates(coordinates)
  }
}

const createMavenUrlFromCoordinates = async coordinates => {
  const cacheKey = `${coordinates.groupId}:${coordinates.artifactId}:${coordinates.version}`
  return mavenUrlCache.getOrSet(cacheKey, () => createMavenUrlFromCoordinatesNoCache(coordinates))
}

const createMavenUrlFromCoordinatesNoCache = async coordinates => {
  const {
    default: urlExist,
  } = await import("url-exist")

  // We prefer the newer, central.sonatype links, but publishing glitches mean some extensions don't show in sonatype central
  const url = `https://central.sonatype.com/artifact/${coordinates.groupId}/${coordinates.artifactId}/${coordinates.version}/jar`
  const exists = await urlExist(url)
  if (exists) {
    return url
  } else {
    // Validating these is so unreliable, don't do it at build-time, just let the links test complain
    // ?eh= avoids the redirect to the page that doesn't exist
    return `https://search.maven.org/artifact/${coordinates.groupId}/${coordinates.artifactId}/${coordinates.version}/jar?eh=`
  }
}

const createMavenPomUrlFromCoordinates = async coordinates => {
  const pathifiedGroupId = coordinates.groupId?.replace(/\./g, "/")

  // Don't validate the maven url; even the mirror sometimes returns false from urlExist, and we're better off doing retries during the fetch of the actual contents
  return `https://repo1.maven.org/maven2/${pathifiedGroupId}/${coordinates.artifactId}/${coordinates.version}/${coordinates.artifactId}-${coordinates.version}.pom`
}

const createMavenMetadataUrlFromCoordinates = async coordinates => {
  const pathifiedGroupId = coordinates.groupId?.replace(/\./g, "/")

  if (!coordinates.version) {
    return `https://repo1.maven.org/maven2/${pathifiedGroupId}/${coordinates.artifactId}/maven-metadata.xml`
  } else {

  }

}


module.exports = {
  createMavenUrlFromCoordinates,
  createMavenUrlFromArtifactString,
  createMavenPomUrlFromCoordinates,
  createMavenMetadataUrlFromCoordinates,
  initMavenUrlCache,
  saveMavenUrlCache,
}
