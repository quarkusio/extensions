const path = require(`path`)
const axios = require("axios")

const {
  getPlatformId,
  getStream,
} = require("./src/components/util/pretty-platform")
const { sortableName } = require("./src/components/util/sortable-name")
const { extensionSlug } = require("./src/components/util/extension-slugger")
const { generateMavenInfo } = require("./src/maven/maven-info")
const { createRemoteFileNode } = require("gatsby-source-filesystem")
const { rewriteGuideUrl } = require("./src/components/util/guide-url-rewriter")

exports.sourceNodes = async ({
                               actions,
                               getCache,
                               createNodeId,
                               createContentDigest,
                             }) => {
  const { createNode } = actions
  const {
    data: { extensions },
  } = await axios.get(`https://registry.quarkus.io/client/extensions/all`)

  const {
    data: { platforms },
  } = await axios.get(`https://registry.quarkus.io/client/platforms`)

  // Do a first pass of processing, to try and fill in release dates
  const firstPromises = extensions.map(async extension => {
    extension.metadata = extension.metadata || {}
    if (extension.artifact) {
      // This is very slow. Would doing it as a remote file help speed things up?
      extension.metadata.maven = await generateMavenInfo(extension.artifact)
    }
  })

  await Promise.all(firstPromises)

  const categoriesWithDuplicates = extensions
    .map(extension => extension.metadata.categories)
    .flat()

  const categories = [...new Set(categoriesWithDuplicates)]

  const categoryPromises = categories.map(async category => {
    if (category) {
      const slug = extensionSlug(category)
      const id = createNodeId(slug)
      const count = categoriesWithDuplicates.filter(c => c === category).length // Not as proper as a reduce, but much easier to read :)
      const node = {
        name: category,
        count,
        id,
        sortableName: sortableName(category),
        internal: {
          type: "Category",
          contentDigest: createContentDigest(category),
        },
      }

      return createNode(node)
    }
  })

  await Promise.all(categoryPromises)

  // Do a map so we can wait on the result
  const secondPromises = extensions.map(async extension => {
    const slug = extensionSlug(extension.artifact)
    const id = createNodeId(slug)
    const node = {
      metadata: {},
      ...extension,
      id,
      sortableName: sortableName(extension.name),
      slug,
      internal: {
        type: "Extension",
        contentDigest: createContentDigest(extension),
      },
      platforms: extension.origins?.map(origin => getPlatformId(origin)),
      streams: extension.origins?.map(origin => getStream(origin, platforms)),
    }
    if (typeof node.metadata.unlisted === "string") {
      if (node.metadata.unlisted.toLowerCase() === "true") {
        node.metadata.unlisted = true
      } else {
        node.metadata.unlisted = false
      }
    }

    // Avoid dashes in property names, since they get converted to underscores in some places and it's error-prone
    node.metadata.icon = node.metadata["icon-url"]
    delete node.metadata["icon-url"]

    if (node.metadata.icon) {
      await createRemoteFileNode({
        url: node.metadata.icon,
        name: path.basename(node.metadata.icon),
        parentNodeId: node.id,
        getCache,
        createNode,
        createNodeId,
      })
    }

    // The status could be an array *or* a string, so make it consistent by wrapping in an array
    if (node.metadata.status && !Array.isArray(node.metadata.status)) {
      node.metadata.status = [node.metadata.status]
    }

    // Use a better name and some structure for the source control information
    // This is the id of the other node, and it needs to be unique per extension, even extensions which share a repo
    // The scm node generator parses this string to extract the url, so format matters
    node.metadata.sourceControl = node.metadata["scm-url"]
      ? `${node.metadata["scm-url"]},${node.metadata?.maven?.groupId}.${node.metadata?.maven?.artifactId}`
      : undefined
    // Tidy up the old scm url
    delete node.metadata["scm-url"]

    node.metadata.builtWithQuarkusCore = node.metadata[
      "built-with-quarkus-core"
      ]?.replace(/.*:/, "") // Some versions have a bit of maven GAV hanging around in the version string, strip it
    delete node.metadata["built-with-quarkus-core"]

    node.metadata.minimumJavaVersion = node.metadata["minimum-java-version"]
    delete node.metadata["minimum-java-version"]

    node.metadata.guide = await rewriteGuideUrl(extension)

    // Look for extensions which are not the same, but which have the same artifact id
    // (artifactId is just the 'a' part of the gav, artifact is the whole gav string)
    const duplicates = extensions.filter(
      ext =>
        ext.metadata.maven?.artifactId === node.metadata.maven?.artifactId &&
        ext.artifact !== node.artifact
    )
    if (duplicates && duplicates.length > 0) {
      const condensedDuplicates = duplicates.map(dupe => {
        // If we're missing a timestamp because we couldn't get it from maven, all we can do is describe the versions as 'different' from each other.
        const relationship =
          dupe.metadata.maven.timestamp && extension.metadata.maven.timestamp
            ? dupe.metadata.maven.timestamp > extension.metadata.maven.timestamp
              ? "newer"
              : "older"
            : "different"

        return {
          artifact: dupe.artifact,
          groupId: dupe.metadata.maven.groupId,
          slug: extensionSlug(dupe.artifact),
          timestamp: dupe.metadata.maven.timestamp,
          relationship,
        }
      })
      node.duplicates = condensedDuplicates

      if (
        condensedDuplicates &&
        condensedDuplicates.find(dupe => dupe.relationship === "newer")
      ) {
        node.isSuperseded = true
      }
    }

    return createNode(node)
  })
  return Promise.all(secondPromises)
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
            isSuperseded
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
      const previousPostId = getPreviousPost(index, posts)
      const nextPostId = getNextPost(index, posts)

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

const getPreviousPost = (index, posts) => {
  let i = index
  while (i > 0) {
    i--
    // Skip over superseded posts in the next and previous links
    if (!posts[i].isSuperseded) {
      return posts[i].id
    }
  }
}

const getNextPost = (index, posts) => {
  let i = index
  while (i < posts.length - 2) {
    i++
    // Skip over superseded posts in the next and previous links
    if (!posts[i].isSuperseded) {
      return posts[i].id
    }
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
      status: [String]
      builtWithQuarkusCore: String
      quarkus_core_compatibility: String
      unlisted: Boolean
      maven: MavenInfo
      sourceControl: SourceControlInfo @link(by: "key")
      icon: File @link(by: "url")
      sponsors: [String]
      sponsor: String
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
