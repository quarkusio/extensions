const gh = require("parse-github-url")

const defaultOptions = {
  nodeType: "Extension",
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
  const coords = gh(scmUrl)

  const project = coords.name

  const scmInfo = { url: scmUrl, project }

  const accessToken = process.env.GRAPHQL_ACCESS_TOKEN
  if (accessToken) {
    const query = `
  query {
    repository(owner:"${coords.owner}", name:"${project}") {
      issues(states:OPEN) {
        totalCount
      }
    }
    
    repositoryOwner(login: "${coords.owner}") {
        avatarUrl
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
        repositoryOwner: { avatarUrl },
      },
    } = body

    scmInfo.issues = totalCount
    scmInfo.logoUrl = avatarUrl

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
