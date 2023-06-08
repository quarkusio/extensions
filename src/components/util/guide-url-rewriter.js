const urlExist = require("url-exist")

const rewriteGuideUrl = async ({ name, metadata }) => {
  const exists = metadata?.guide && (await urlExist(metadata.guide))
  const originalLink = metadata?.guide
  // In general, links should be valid. However, relax that requirement for deprecated extensions because
  // the guide may have been taken down well after the release, and an extension is not going to do a new release
  // to remove a dead guide link, on an extension which is dead anyway.
  if (!exists) {
    if (metadata?.status?.includes("deprecated")) {
      console.warn(
        "Stripping dead guide link from deprecated extension. Extension is:",
        name,
        "and guide link is",
        originalLink
      )
      return undefined
    } else if (metadata?.guide) {
      const transforms = [
        metadata => metadata.guide.replace("guides", "version/main/guides"),
        metadata => metadata.guide.replace("latest", "next"),
        metadata => {
          const approxVersion = metadata.maven?.version.replace(
            /([0-9]+\.[0-9]+\.).+/,
            "$1x"
          )
          return metadata.guide.replace("latest", approxVersion)
        },
        metadata => {
          // Last ditch attempt; check the most n - 1 docs version
          // This corrects the case where an extension has not yet been included in the snapshot
          // Tactical hardcoding; we should make this less hacky
          const secondMostRecentVersion = "2.13"
          return metadata.guide.replace(
            "/guides/",
            `/version/${secondMostRecentVersion}/guides/`
          )
        },
      ]
      for (let i = 0; i < transforms.length; i++) {
        const transform = transforms[i]

        const newLink = transform(metadata)
        const newLinkExists = await urlExist(newLink)
        if (newLinkExists && originalLink !== newLink) {
          console.warn(
            `Mapping dead guide link ${originalLink} to a live version, ${newLink}`
          )
          return newLink
        }
      }
    }
  }

  return originalLink
}

module.exports = { rewriteGuideUrl }
