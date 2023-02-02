const parse = require("mvn-artifact-name-parser").default

const mappings = {
  "Quarkus Non Platform Extensions": "Non Platform Extensions",
  "Quarkus Bom Quarkus Platform Descriptor": "Quarkus Platform",
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

const prettyPlatformName = platformId => {
  const words = platformId?.split(/[ -]/)
  const pretty = words
    ?.map(word => {
      return word[0].toUpperCase() + word.substring(1)
    })
    .join(" ")

  return mappings[pretty] ? mappings[pretty] : pretty
}

module.exports = { prettyPlatformName, getPlatformId, getStream }
