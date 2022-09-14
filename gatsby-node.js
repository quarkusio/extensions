const path = require(`path`)
const axios = require("axios")
const GithubSlugger = require("github-slugger")

const slugger = new GithubSlugger()

exports.sourceNodes = async ({
  actions,
  createNodeId,
  createContentDigest,
}) => {
  const { data } = await axios.get(
    `https://registry.quarkus.io/client/non-platform-extensions?v=2.0.7`
  )

  data.extensions.forEach(extension => {
    actions.createNode({
      ...extension,
      id: createNodeId(extension.name),
      // slug: slugger(extension.name),
      slug: slugger.slug(extension.name, false),
      internal: {
        type: "extension",
        contentDigest: createContentDigest(extension),
      },
    })
  })
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

exports.onCreateNode = ({ node, actions }) => {
  const { createNodeField } = actions

  // TODO why doesn't this work, so we have to do it in the create call?
  if (node.internal.type === `Extension`) {
    const value = slugger.slug(node.name, false)

    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions

  // Explicitly define the siteMetadata {} object
  // This way those will always be defined even if removed from gatsby-config.js

  createTypes(`
  
    type Extension {
      name: String!
      description: String
      slug: String!
      metadata: ExtensionMetadata
      }
      
    type ExtensionMetadata {
      categories: [String]
    }
    
    type SiteSiteMetadata {
      author: Author
      siteUrl: String
      social: Social
    }

    type Author {
      name: String
      summary: String
    }

    type Social {
      twitter: String
    }

  `)
}
