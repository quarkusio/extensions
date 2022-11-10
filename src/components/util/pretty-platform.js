const mappings = {
  "Quarkus Non Platform Extensions": "Non Platform Extensions",
  "Quarkus Bom Quarkus Platform Descriptor": "Quarkus Platform",
}

export default origin => {
  const elements = origin.split(":")
  const element = elements.length > 1 ? elements[1] : origin

  const words = element.split(/[ -]/)
  const pretty = words
    .map(word => {
      return word[0].toUpperCase() + word.substring(1)
    })
    .join(" ")

  // Now do some final mappings
  return mappings[pretty] ? mappings[pretty] : pretty
}
