const axios = require("axios")
const PersistableCache = require("../persistable-cache")

const DAY_IN_SECONDS = 60 * 60 * 24
const NONE = "none"
let urlCache

const initJavadocCache = async () => {
  // If there are problems with the cache, it works well to add something like latestVersionCache.flushAll() on a main-branch build
  // (and then remove it next build)

  urlCache = new PersistableCache({ key: "javadoc-urls", stdTTL: 8 * DAY_IN_SECONDS })


  await urlCache.ready()
  console.log("Ingested cached information for", urlCache.size(), "javadoc urls.")
}

const createJavadocUrlFromCoordinates = async coordinates => {
  if (coordinates && coordinates.groupId) {
    const url = await urlCache.getOrSet(coordinates.groupId + coordinates.artifactId, () => createJavadocUrlFromCoordinatesNoCache(coordinates))
    if (url !== NONE) {
      return url
    }
  }
}


const createJavadocUrlFromCoordinatesNoCache = async coordinates => {
  if (coordinates && coordinates.groupId) {
    const url = `https://javadoc.io/doc/${coordinates.groupId}/${coordinates.artifactId}/${coordinates.version}/index.html`

    try {
      const response = await axios.get(url,
        {}
      )
      const { data } = response
      // javadoc.io returns 200 whether the javadoc is populated or not, so we need to check the page contents
      // Do a crude string comparison; the actual javadoc comes in as an iframe labelled docContainer
      if (data && data.includes("docContainer")) {
        return url
      }
    } catch (e) {
      console.warn("Could not get the contents of", url)
    }
  }
  // Return something for the negative case, so we can cache it
  return NONE
}

module.exports = {
  initJavadocCache,
  createJavadocUrlFromCoordinates,
}
