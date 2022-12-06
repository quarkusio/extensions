const defaultOptions = {
  nodeType: "extension",
}

exports.onCreateNode = async ({ node, getNode, actions }, pluginOptions) => {
  const { createNodeField } = actions

  const options = {
    ...defaultOptions,
    ...pluginOptions,
  }

  if (node.internal.type !== options.nodeType) {
    return
  }

  const { metadata } = node
  const scmUrl = metadata["scm-url"]

  if (scmUrl) {
    // We should do this properly with the API, but for now make an educated guess about the image URL
    // See https://stackoverflow.com/questions/22932422/get-github-avatar-from-email-or-name
    // remove everything after the last backslash
    const orgUrl = scmUrl.substr(0, scmUrl.lastIndexOf("/"))
    const project = scmUrl.substr(scmUrl.lastIndexOf("/") + 1)
    const logoUrl = orgUrl + ".png"
    const scmInfo = { url: scmUrl, logoUrl, project }

    createNodeField({
      node,
      name: "sourceControlInfo",
      value: scmInfo,
    })
  }
}

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions
  const typeDefs = `
  type SourceControlInfo implements Node {
    url: String
    logo: String
  }
  `
  createTypes(typeDefs)
}
