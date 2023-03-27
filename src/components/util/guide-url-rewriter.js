import urlExist from "url-exist"

const rewriteGuideUrl = async ({ name, metadata }) => {
  const exists = metadata?.guide && (await urlExist(metadata.guide))
  // In general, links should be valid. However, relax that requirement for deprecated extensions because
  // the guide may have been taken down well after the release, and an extension is not going to do a new release
  // to remove a dead guide link, on an extension which is dead anyway.
  if (metadata?.status?.includes("deprecated") && metadata?.guide && !exists) {
    console.warn(
      "Stripping dead guide link from deprecated extension. Extension is:",
      name,
      "and guide link is",
      metadata.guide
    )
    return undefined
  }
  return metadata?.guide
}

module.exports = { rewriteGuideUrl }
