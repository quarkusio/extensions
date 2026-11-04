// A unique identifier for an extension's source control information. It needs to be unique per extension, even extensions which share a repo.
// This is the key used in the synced source control data, so the sync tools and the gatsby build must agree on its format.
// The format is the scm url and the maven coordinates, comma-separated, and the scm info fetcher parses the url back out of it.
const sourceControlId = (scmUrl, maven) => {
  return scmUrl ? `${scmUrl},${maven?.groupId}.${maven?.artifactId}` : undefined
}

module.exports = { sourceControlId }
