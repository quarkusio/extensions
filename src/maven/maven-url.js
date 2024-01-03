const parse = require("mvn-artifact-name-parser").default

const createMavenUrlFromArtifactString = async artifact => {
  // Do some light pre-checking so we don't have to deal with catching
  if (artifact && artifact.includes(":")) {
    const coordinates = parse(artifact)
    return createMavenUrlFromCoordinates(coordinates)
  }
}

const createMavenUrlFromCoordinates = async coordinates => {

  // We have to access the url exist as a dynamic import (because CJS), await it because dynamic imports give a promise, and then destructure it to get the default
  // A simple property read won't work
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

const createMavenArtifactsUrlFromCoordinates = async coordinates => {
  const pathifiedGroupId = coordinates.groupId?.replace(/\./g, "/")
  // We have to access the url exist as a dynamic import (because CJS), await it because dynamic imports give a promise, and then destructure it to get the default
  // A simple property read won't work
  const {
    default: urlExist,
  } = await import("url-exist")
  
  const url = `https://repo1.maven.org/maven2/${pathifiedGroupId}/${coordinates.artifactId}/${coordinates.version}/${coordinates.artifactId}-${coordinates.version}.pom`
  const exists = await urlExist(url)
  if (exists) {
    return url
  } else {
    console.warn(
      "Could not work out url. Best guess was ",
      url,
      "but it does not seem to exist."
    )
  }
}

module.exports = {
  createMavenUrlFromCoordinates,
  createMavenUrlFromArtifactString,
  createMavenArtifactsUrlFromCoordinates,
}
