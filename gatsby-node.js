const path = require(`path`)
const axios = require("axios")

const { getPlatformId } = require("./src/components/util/pretty-platform")
const { sortableName } = require("./src/components/util/sortable-name")
const { extensionSlug } = require("./src/components/util/extension-slugger")
const { generateMavenInfo } = require("./src/maven/maven-info")

exports.sourceNodes = async ({
  actions,
  createNodeId,
  createContentDigest,
}) => {
  const { data } = await axios.get(
    `https://registry.quarkus.io/client/extensions/all`
  )

  // Do a map so we can wait
  const promises = data.extensions.map(async extension => {
    const node = {
      metadata: {},
      ...extension,
      id: createNodeId(extension.name),
      sortableName: sortableName(extension.name),
      slug: extensionSlug(extension.artifact),
      internal: {
        type: "Extension",
        contentDigest: createContentDigest(extension),
      },
      platforms: extension.origins?.map(origin => getPlatformId(origin)),
    }
    if (typeof node.metadata.unlisted === "string") {
      if (node.metadata.unlisted.toLowerCase() === "true") {
        node.metadata.unlisted = true
      } else {
        node.metadata.unlisted = false
      }
    }

    // Use a better name and some structure for the source control information
    node.metadata.sourceControl = node.metadata["scm-url"]
    // Tidy up the old scm url
    delete node.metadata["scm-url"]

    if (node.artifact) {
      // This is very slow. Would doing it as a remote file help speed things up?
      node.metadata.maven = await generateMavenInfo(node.artifact)
    }

    return actions.createNode(node)
  })
  return Promise.all(promises)
}

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions

  // Define a template for an extension
  const extensionTemplate = path.resolve(`./src/templates/extension-detail.js`)

  // Get all extensions
  const result = await graphql(
    `
      {
        allExtension(sort: { fields: [name], order: ASC }, limit: 1000) {
          nodes {
            id
            slug
          }
        }
      }
    `
  )

  if (result.errors) {
    reporter.panicOnBuild(
      `There was an error loading extensions`,
      result.errors
    )
    return
  }

  const posts = result.data.allExtension.nodes

  // Create extension pages
  // `context` is available in the template as a prop and as a variable in GraphQL

  if (posts.length > 0) {
    posts.forEach((post, index) => {
      const previousPostId = index === 0 ? null : posts[index - 1].id
      const nextPostId = index === posts.length - 1 ? null : posts[index + 1].id

      createPage({
        path: post.slug,
        component: extensionTemplate,
        context: {
          id: post.id,
          previousPostId,
          nextPostId,
        },
      })
    })
  }
}

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions

  createTypes(`
  
    type Extension implements Node {
      name: String!
      description: String
      slug: String!
      metadata: ExtensionMetadata
      origins: [String]
      }
      
    type ExtensionMetadata {
      categories: [String]
      built_with_quarkus_core: String
      quarkus_core_compatibility: String
      unlisted: Boolean
      maven: MavenInfo
      sourceControl: SourceControlInfo @link(by: "url")

    }
    
    type MavenInfo {
      url: String
      version: String
      timestamp: String
    }
 
  `)
  // We use string to represent the timestamp, because otherwise we risk bursting the 32-bit integer limit in graphql

  // What's going on with the @link? https://hashinteractive.com/blog/gatsby-data-relationships-with-foreign-key-fields/ explains
}
