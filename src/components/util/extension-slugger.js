const parse = require("mvn-artifact-name-parser").default
const slugify = require("slugify")

const slugifyPart = string => {
  return slugify(string, {
    lower: true,
  })
}

const extensionSlug = gav => {
  if (gav) {
    let string
    if (gav.includes(":")) {
      const coordinates = parse(gav)
      // slugs can have slashes in them, so use folders to group extensions in the same group
      // slugify strips slashes, so slugify before adding the slashes
      string =
        slugifyPart(coordinates.groupId) +
        "/" +
        slugifyPart(coordinates.artifactId)
    } else {
      string = slugifyPart(gav)
    }

    return string
  }
}
module.exports = { extensionSlug }
