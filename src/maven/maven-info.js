const { default: parse } = require("mvn-artifact-name-parser")
const { createMavenUrlFromCoordinates } = require("./maven-url")

const generateMavenInfo = async artifact => {
  const maven = parse(artifact)
  const mavenUrl = await createMavenUrlFromCoordinates(maven)
  if (mavenUrl) {
    maven.url = mavenUrl
  }
  return maven
}
module.exports = { generateMavenInfo }
