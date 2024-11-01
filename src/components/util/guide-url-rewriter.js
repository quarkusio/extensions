const rewriteGuideUrl = async ({ name, metadata, isSuperseded }) => {
  // We have to access the url exist as a dynamic import (because CJS), await it because dynamic imports give a promise, and then destructure it to get the default
  // A simple property read won't work
  const {
    default: urlExist,
  } = await import("url-exist")


  const exists = metadata?.guide && (await urlExist(metadata.guide))
  const originalLink = metadata?.guide
  // In general, links should be valid. However, relax that requirement for deprecated extensions because
  // the guide may have been taken down well after the release, and an extension is not going to do a new release
  // to remove a dead guide link, on an extension which is dead anyway.
  //Also relax it for Camel extensions - see https://github.com/apache/camel-quarkus/issues/5814#issuecomment-1968999263
  if (!exists) {
    if (metadata?.status?.includes("deprecated")) {
      console.warn(
        "Stripping dead guide link from deprecated extension. Extension is:",
        name,
        "and guide link is",
        originalLink
      )
      return undefined
    } else if (isSuperseded) {
      console.warn(
        "Stripping dead guide link from superseded extension. Extension is:",
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
        metadata => {
          // Camel format, hardcoded LTS
          return metadata.guide.replace(
            "/latest/",
            "/2.16.x/"
          )
        },
        metadata => {
          // Camel format, hardcoded LTS
          return metadata.guide.replace(
            "/latest/",
            "/2.13.x/"
          )
        }
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

    // If none of the transforms worked, if this is a camel link, drop the dead link
    if (metadata?.maven?.groupId === "org.apache.camel.quarkus") {
      console.warn(
        "Dropping dead guide link from Camel extension. Extension is:",
        name,
        "and guide link is",
        originalLink
      )
      return undefined
    }
  }

  return originalLink
}

module.exports = { rewriteGuideUrl }
