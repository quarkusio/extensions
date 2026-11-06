const axios = require("axios")
const { default: parse } = require("mvn-artifact-name-parser")
const { sourceControlId } = require("../../src/data/source-control-id")

// Fetches the extensions from the registry, with just the information needed to look up the extension's external data
const fetchExtensions = async () => {
  const {
    data: { extensions },
  } = await axios.get(`https://registry.quarkus.io/client/extensions/all`)

  return extensions.filter(extension => extension.artifact).map(extension => {
    const maven = parse(extension.artifact)
    const scmUrl = extension.metadata?.["scm-url"]
    return {
      artifact: extension.artifact,
      name: extension.name,
      guide: extension.metadata?.guide,
      status: extension.metadata?.status,
      icon: extension.metadata?.["icon-url"],
      groupId: maven.groupId,
      artifactId: maven.artifactId,
      sourceControl: sourceControlId(scmUrl, maven),
      sponsor: extension.metadata?.sponsor,
    }
  })
}

module.exports = { fetchExtensions }
