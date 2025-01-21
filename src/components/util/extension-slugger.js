const parse = require("mvn-artifact-name-parser").default
const slugify = require("slugify")
const { monthFormatOptions } = require("./date-utils")
const newExtensionsPrefix = "new-extensions/"

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
      string = extensionSlugFromCoordinates(coordinates)
    } else {
      string = slugifyPart(gav)
    }
    return string
  }
}

const extensionSlugFromCoordinates = coordinates => {

  // slugs can have slashes in them, so use folders to group extensions in the same group
  // slugify strips slashes, so slugify before adding the slashes
  return slugifyPart(coordinates.groupId) + "/" + slugifyPart(coordinates.artifactId)

}

function slugForExtensionsAddedMonth(month) {
  if (month) {
    const date = new Date(+month)
    return `${newExtensionsPrefix}${date.getFullYear()}/${date.toLocaleDateString("en-US", monthFormatOptions).toLowerCase()}`
  } else {
    return newExtensionsPrefix
  }
}

function slugForExtensionsAddedYear(year) {
  if (year) {
    const date = new Date(+year)
    return newExtensionsPrefix + date.getFullYear()
  } else {
    return newExtensionsPrefix
  }
}

module.exports = {
  extensionSlug,
  extensionSlugFromCoordinates,
  slugForExtensionsAddedMonth,
  slugForExtensionsAddedYear
}
