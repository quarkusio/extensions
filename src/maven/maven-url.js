const urlExist = require("url-exist")
const parse = require("mvn-artifact-name-parser").default

const createMavenUrlFromArtifactString = async artifact => {
  // Do some light pre-checking so we don't have to deal with catching
  if (artifact && artifact.includes(":")) {
    const coordinates = parse(artifact)
    return createMavenUrlFromCoordinates(coordinates)
  }
}

const createMavenUrlFromCoordinates = async coordinates => {
  const url = `https://search.maven.org/artifact/${coordinates.groupId}/${coordinates.artifactId}/${coordinates.version}/jar`
  const exists = await urlExist(url)
  if (exists) {
    return url
  } else {
    console.warn("Could not work out url. Best guess was ", url)
  }
}

module.exports = {
  createMavenUrlFromCoordinates,
  createMavenUrlFromArtifactString,
}
