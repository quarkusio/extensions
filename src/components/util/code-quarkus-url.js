import { default as parse } from "mvn-artifact-name-parser"

const codeQuarkusUrl = ({ artifact, unlisted, platforms, streams }) => {
  // Do some light pre-checking so we don't have to deal with catching
  if (artifact && artifact.includes(":")) {
    if (!unlisted) {
      const coordinates = parse(artifact)
      const artifactId = coordinates.artifactId
      if (
        platforms &&
        platforms.includes("quarkus-bom-quarkus-platform-descriptor")
      ) {
        const trimmedArtifactId = artifactId.replace(/^quarkus-/, "")
        // Don't return a URL if the streams aren't available on code.quarkus
        const currentStreams =
          streams && streams.filter(stream => stream.isLatestThree)
        const isCurrent = currentStreams?.length > 0
        if (isCurrent) {
          // Choose a stream arbitrarily if there are multiple, since we have no good basis for choosing; almost always there will only be one, and it will be the latest
          // Do not put in a stream if it's an alpha
          const stream = currentStreams.find(s => !s.isAlpha)
          if (stream) {
            // We could perhaps do proper url encoding, but home-roll an encoded url
            const streamQuery = `&S=${stream.platformKey}%3A${stream.id}`
            return `https://code.quarkus.io/?e=${trimmedArtifactId}${streamQuery}`
          } else {
            return `https://code.quarkus.io/?e=${trimmedArtifactId}`
          }
        }
      } else {
        return `https://code.quarkus.io/?e=${coordinates.groupId}%3A${coordinates.artifactId}`
      }
    }
  }
}

export default codeQuarkusUrl
