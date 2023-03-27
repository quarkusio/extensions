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
      let newLink = metadata.guide.replace("guides", "version/main/guides")
      if (await urlExist(newLink)) {
        // Don't generate chatter if a link works on retry
        if (originalLink !== newLink) {
          console.warn(
            `Mapping dead guide link ${originalLink} to snapshot version, ${newLink}`
          )
        }
        return newLink
      } else {
        const approxVersion = metadata.maven?.version.replace(
          /([0-9]+\.[0-9]+\.).+/,
          "$1x"
        )
        newLink = metadata.guide.replace("latest", approxVersion)
        console.log("checking", newLink)
        if (await urlExist(newLink)) {
          // Don't generate chatter if a link works on retry
          // Many of the hits here are cases where the original link redirects and urlExist reports that as not existing
          // I think it's ok for us to pre-code the redirect, but it's a shame about the chatter
          if (originalLink !== newLink) {
            console.log(
              `Mapping dead (or redirected) guide link ${originalLink} to ${newLink} (specified version)`
            )
          }
          return newLink
        }
      }
    }
  }

  return originalLink
}

module.exports = { rewriteGuideUrl }
