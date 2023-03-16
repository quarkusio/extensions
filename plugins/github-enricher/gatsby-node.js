const gh = require("parse-github-url")
const path = require("path")
const encodeUrl = require("encodeurl")

const { getCache } = require("gatsby/dist/utils/get-cache")
const { createRemoteFileNode } = require("gatsby-source-filesystem")
const { labelExtractor } = require("./labelExtractor")

const defaultOptions = {
  nodeType: "Extension",
}

let getLabels

// TODO ideally we would cache between builds, too
exports.onPreBootstrap = async ({}) => {
  const res = await fetch(
    "https://raw.githubusercontent.com/quarkusio/quarkus/main/.github/quarkus-github-bot.yml",
    {
      method: "GET",
    }
  )

  const yaml = res && res.text ? await res.text() : ""

  getLabels = labelExtractor(yaml).getLabels

  // Return the promise so the execution waits for us
  return yaml
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
  // A bit ugly, we need a unique identifier in string form, and we also need the url; use a comma-separated string
  const id = metadata?.sourceControl
  const scmUrl = id?.split(",")[0]

  if (scmUrl) {
    const labels = await fetchScmLabel(scmUrl, node.metadata?.maven?.artifactId)

    const scmInfo = await fetchScmInfo(
      scmUrl,
      node.metadata?.maven?.artifactId,
      labels
    )

    scmInfo.id = createNodeId(id)
    // We need a non-obfuscated version of the id to act as a foreign key
    scmInfo.key = id

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

async function fetchScmLabel(scmUrl, artifactId) {
  // Special case extensions which live in the quarkus repo; in the future we could generalise,
  // but at the moment we only know how to find a label for quarkus
  if (scmUrl === "https://github.com/quarkusio/quarkus") {
    return getLabels(artifactId)
  }
}

const fetchScmInfo = async (scmUrl, artifactId, labels) => {
  // TODO we can just treat label as an array, almost
  const labelFilterString = labels
    ? `, filterBy: { labels:  [${labels.map(label => `"${label}"`).join()}] }`
    : ""

  const coords = gh(scmUrl)

  const project = coords.name

  // Some multi-extension projects use just the 'different' part of the name in the folder structure
  const shortArtifactId = artifactId?.replace(coords.name + "-", "")

  const issuesUrl = labels
    ? encodeUrl(
        scmUrl +
          "/issues?q=is%3Aopen+is%3Aissue+label%3A" +
          labels.map(label => label.replace("/", "%2F")).join(",")
      )
    : scmUrl + "/issues"

  const scmInfo = { url: scmUrl, project, issuesUrl, labels }

  const accessToken = process.env.GITHUB_TOKEN

  // This query is long, because I can't find a way to do "or" or
  // Batching this may not help that much because rate limits are done on query complexity and cost,
  // not the number of actual http calls; see https://docs.github.com/en/graphql/overview/resource-limitations
  if (accessToken) {
    const query = `
  query {
    repository(owner:"${coords.owner}", name:"${coords.name}") {
      issues(states:OPEN, ${labelFilterString}) {
        totalCount
      }
    
      defaultBranchRef {
        name
      }
    
      metaInfs: object(expression: "HEAD:runtime/src/main/resources/META-INF/") {
        ... on Tree {
          entries {
            path
          }
        }
      }
    
      subfolderMetaInfs: object(expression: "HEAD:${artifactId}/runtime/src/main/resources/META-INF/") {
        ... on Tree {
          entries {
            path
          }
        }
      }
      
      shortenedSubfolderMetaInfs: object(expression: "HEAD:${shortArtifactId}/runtime/src/main/resources/META-INF/") {
        ... on Tree {
          entries {
            path
          }
        }
      }
      
      openGraphImageUrl
    }
    
    repositoryOwner(login: "${coords.owner}") {
        avatarUrl
    }
  }`

    let body = undefined
    let count = 0

    // We sometimes get bad results back from the git API where json() is null, so do a bit of retrying
    while (!body?.data && count < 3) {
      count++
      const res = await fetch("https://api.github.com/graphql", {
        method: "POST",
        body: JSON.stringify({ query }),
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      body = await res.json()
      if (!body?.data) {
        console.warn(
          "Retrying GitHub fetch for",
          artifactId,
          "- response is",
          body
        )
      }
    }

    if (body?.data) {
      const {
        data: {
          repository: {
            issues: { totalCount },
            defaultBranchRef,
            metaInfs,
            subfolderMetaInfs,
            shortenedSubfolderMetaInfs,
            openGraphImageUrl,
          },
          repositoryOwner: { avatarUrl },
        },
      } = body

      const allMetaInfs = [
        ...(metaInfs ? metaInfs.entries : []),
        ...(subfolderMetaInfs ? subfolderMetaInfs.entries : []),
        ...(shortenedSubfolderMetaInfs
          ? shortenedSubfolderMetaInfs.entries
          : []),
      ]

      const extensionYamls = allMetaInfs.filter(entry =>
        entry.path.endsWith("/quarkus-extension.yaml")
      )

      scmInfo.issues = totalCount

      scmInfo.owner = coords.owner
      scmInfo.ownerImageUrl = avatarUrl

      // We should only have one extension yaml - if we have more, don't guess, and if we have less, don't set anything
      if (extensionYamls.length === 1) {
        scmInfo.extensionYamlUrl = `${scmUrl}/blob/${defaultBranchRef?.name}/${extensionYamls[0].path}`
      }

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
        "Cannot read GitHub information, because the API did not return any data."
      )
      return scmInfo
    }
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
    extensionYamlUrl: String
    issues: String
    socialImage: File @link(by: "url")
    projectImage: File @link(by: "name")
  }
  `
  createTypes(typeDefs)
}
