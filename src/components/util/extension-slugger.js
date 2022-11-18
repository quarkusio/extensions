const parse = require("mvn-artifact-name-parser").default
const slugify = require("slugify")

const extensionSlug = gav => {
  let string
  if (gav && gav.includes(":")) {
    const coordinates = parse(gav)
    string = coordinates.groupId + "_" + coordinates.artifactId
  } else {
    string = gav
  }
  // We don't want dots in the url even though they are technically allowed
  const deDotted = string.replace(/\./g, "-")
  return slugify(deDotted, {
    lower: true,
  })
}
module.exports = { extensionSlug }
