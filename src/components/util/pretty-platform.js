const mappings = {
  "Quarkus Non Platform Extensions": "Non Platform Extensions",
  "Quarkus Bom Quarkus Platform Descriptor": "Quarkus Platform",
}

const getPlatformId = origin => {
  const elements = origin && origin.split(":")
  const id = elements?.length > 1 ? elements[1] : origin

  return id
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

module.exports = { prettyPlatformName, getPlatformId }
