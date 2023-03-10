const parse = require("mvn-artifact-name-parser").default

const nonPlatformExtensionName = "Other"
const mappings = {
  "Quarkus Bom Quarkus Platform Descriptor": "Quarkus",
  "Quarkus Qpid Jms Bom Quarkus Platform Descriptor": "Qpid JMS",
  "Quarkus Non Platform Extensions": nonPlatformExtensionName,
}

const getPlatformId = origin => {
  if (origin && origin.includes(":")) {
    const coordinates = parse(origin)
    return coordinates.artifactId
  } else {
    return origin
  }
}

const getStream = (origin, currentPlatforms) => {
  if (origin && origin.includes(":")) {
    const coordinates = parse(origin)
    const versionParts = coordinates.version.split(".")
    const id = `${versionParts[0]}.${versionParts[1]}`
    const platform = currentPlatforms?.find(
      platform => platform["platform-key"] === coordinates.groupId
    )
    const isLatestThree =
      platform?.streams.find(stream => stream.id === id) != null
    return {
      platformKey: coordinates.groupId,
      id: id,
      isLatestThree,
    }
  }
}

const qualifiedPrettyPlatform = origin => {
  if (origin && origin.includes(":")) {
    const coordinates = parse(origin)

    const prettyPlatform = prettyPlatformName(coordinates.artifactId)

    if (prettyPlatform === nonPlatformExtensionName) {
      return prettyPlatform
    } else {
      return `${coordinates.groupId}:${prettyPlatform}`
    }
  }
}

const prettyPlatformName = platformId => {
  const words = platformId?.split(/[ -]/)
  let pretty = words
    ?.map(word => {
      return word[0].toUpperCase() + word.substring(1)
    })
    .join(" ")

  // Check if we have a mapping for this; if not, strip the opening 'Quarkus' to increase signal-to-noise
  pretty = mappings[pretty]
    ? mappings[pretty]
    : pretty?.replace(/^Quarkus /, "")

  // Get rid of some word-flab that we will never want
  pretty = pretty?.replace(" Bom Quarkus Platform Descriptor", "")
  pretty = pretty?.replace(" Quarkus Platform Descriptor", "")

  return pretty
}

module.exports = {
  prettyPlatformName,
  getPlatformId,
  getStream,
  qualifiedPrettyPlatform,
}
