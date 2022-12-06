const gh = require("parse-github-url")

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
    const scmInfo = await fetchScmInfo(scmUrl)

    createNodeField({
      node,
      name: "sourceControlInfo",
      value: scmInfo,
    })

    // Return a promise to make sure we wait
    return scmInfo
  }
}

const fetchScmInfo = async scmUrl => {
  // We should do this properly with the API, but for now make an educated guess about the image URL
  // See https://stackoverflow.com/questions/22932422/get-github-avatar-from-email-or-name
  // remove everything after the last backslash

  const orgUrl = scmUrl.substr(0, scmUrl.lastIndexOf("/"))
  const coords = gh(scmUrl)

  const project = coords.name
  const logoUrl = orgUrl + ".png"

  const scmInfo = { url: scmUrl, logoUrl, project }

  const accessToken = process.env.GRAPHQL_ACCESS_TOKEN
  if (accessToken) {
    const query = `
  query {
    repository(owner:"${coords.owner}", name:"${project}") {
      issues(states:OPEN) {
        totalCount
      }
    }
  }`

    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      body: JSON.stringify({ query }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const body = await res.json()

    const {
      data: {
        repository: {
          issues: { totalCount },
        },
      },
    } = body

    scmInfo.issues = totalCount

    return scmInfo
  } else {
    console.warn(
      "Cannot read GitHub information, because the environment variable `GRAPHQL_ACCESS_TOKEN` has not been set."
    )
    // Set a dummy value for the fields, since otherwise gatsby gets stressed about missing data
    scmInfo.issues = ""
    return scmInfo
  }
}

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions
  const typeDefs = `
  type SourceControlInfo implements Node {
    url: String
    logo: String
    issues: String
  }
  `
  createTypes(typeDefs)
}
