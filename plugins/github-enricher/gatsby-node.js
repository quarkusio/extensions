const gh = require("parse-github-url")
const path = require("path")

const { getCache } = require("gatsby/dist/utils/get-cache")
const { createRemoteFileNode } = require("gatsby-source-filesystem")

const defaultOptions = {
  nodeType: "Extension",
}

exports.onCreateNode = async (
  { node, actions, createNodeId, createContentDigest },
  pluginOptions
) => {
  const { createNode } = actions

  const options = {
    ...defaultOptions,
    ...pluginOptions,
  }

  if (node.internal.type !== options.nodeType) {
    return
  }

  const { metadata } = node
  const scmUrl = metadata?.sourceControl

  if (scmUrl) {
    const scmInfo = await fetchScmInfo(scmUrl, createNode, createNodeId, node)

    scmInfo.id = createNodeId(`${scmInfo.owner}.${scmInfo.project}`)

    scmInfo.internal = {
      type: "SourceControlInfo",
      contentDigest: createContentDigest(scmInfo),
    }

    if (scmInfo.socialImage) {
      const fileNode = await createRemoteFileNode({
        url: scmInfo.socialImage,
        name: path.basename(scmInfo.socialImage),
        parentNodeId: scmInfo.id,
        getCache,
        createNode,
        createNodeId,
      })

      // This is the foreign key to the cropped file's name
      // We have to guess what the name will be
      scmInfo.projectImage = "smartcrop-" + path.basename(fileNode.absolutePath)
    }

    createNode(scmInfo)

    // Return a promise to make sure we wait
    return scmInfo
  }
}

const fetchScmInfo = async scmUrl => {
  const coords = gh(scmUrl)

  const project = coords.name

  const scmInfo = { url: scmUrl, project }

  const accessToken = process.env.GITHUB_TOKEN

  if (accessToken) {
    const query = `
  query {
    repository(owner:"${coords.owner}", name:"${coords.name}") {
      issues(states:OPEN) {
        totalCount
      }
      openGraphImageUrl
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
          openGraphImageUrl,
        },
        repositoryOwner: { avatarUrl },
      },
    } = body

    scmInfo.issues = totalCount

    scmInfo.owner = coords.owner
    scmInfo.ownerImageUrl = avatarUrl

    // Only look at the social media preview if it's been set by the user; otherwise we know it will be the owner avatar with some text we don't want
    // This mechanism is a bit fragile, but should work for now
    // Default pattern https://opengraph.githubassets.com/3096043220541a8ea73deb5cb6baddf0f01d50244737d22402ba12d665e9aec2/quarkiverse/quarkus-openfga-client
    // Customised pattern https://repository-images.githubusercontent.com/437045322/39ad4dec-e606-4b21-bb24-4c09a4790b58

    const isCustomizedSocialMediaPreview =
      openGraphImageUrl?.includes("githubusercontent")

    if (isCustomizedSocialMediaPreview) {
      scmInfo.socialImage = openGraphImageUrl
    }

    return scmInfo
  } else {
    console.warn(
      "Cannot read GitHub information, because the environment variable `GITHUB_TOKEN` has not been set."
    )
    return scmInfo
  }
}

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions
  const typeDefs = `
  type SourceControlInfo implements Node @noinfer {
    url: String
    ownerImageUrl: String
    issues: String
    socialImage: File @link(by: "url")
    projectImage: File @link(by: "name")
  }
  `
  createTypes(typeDefs)
}
