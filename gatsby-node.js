const path = require(`path`)
const axios = require("axios")

const {
  getPlatformId,
  getStream,
} = require("./src/components/util/pretty-platform")
const { sortableName } = require("./src/components/util/sortable-name")
const {
  extensionSlug,
  extensionSlugFromCoordinates,
  slugForExtensionsAddedMonth, slugForExtensionsAddedYear
} = require("./src/components/util/extension-slugger")
const { generateMavenInfo, initMavenCache, saveMavenCache } = require("./src/maven/maven-info")
const { createRemoteFileNode } = require("gatsby-source-filesystem")
const { rewriteGuideUrl } = require("./src/components/util/guide-url-rewriter")
const ESLintPlugin = require("eslint-webpack-plugin")
const { validate } = require("./src/data/image-validation")
const fs = require("fs/promises")
const {
  createJavadocUrlFromCoordinates, initJavadocCache,
} = require("./src/javadoc/javadoc-url")
const { getCanonicalMonthTimestamp, getCanonicalYearTimestamp } = require("./src/components/util/date-utils")
let badImages = {}

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

      const javadocUrl = await createJavadocUrlFromCoordinates(extension.metadata.maven)
      if (javadocUrl) {
        extension.metadata.javadoc = { url: javadocUrl }
      }
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

    // Make sure images are valid images, because the sharp plugin will kill the build if it gets anything malformed with an image extension
    if (node.metadata.icon) {
      const iconUrl = node.metadata.icon

      // We can't delete a node once it's created, so we need to (rather tediously) validate the images before creating the node, which means a double download
      // Rule out git hub urls that are not raw
      const isGitHubBlobPage = iconUrl.includes("github.com") && iconUrl.includes("blob") && !iconUrl.includes("raw")

      const isValid = await validate(iconUrl)

      if (!isValid || isGitHubBlobPage) {
        console.warn("Not a valid image in", node.artifact, ". Image link is:", iconUrl)
        delete node.metadata.icon
        if (badImages[iconUrl]) {
          badImages[iconUrl].artifacts.push(node.artifact)
          badImages[iconUrl].slugs.push(node.slug)
        } else {
          badImages[iconUrl] = { url: iconUrl, reason: "Invalid", slugs: [node.slug], artifacts: [node.artifact] }
        }

      } else {
        try {
          await createRemoteFileNode({
            url: iconUrl,
            name: path.basename(iconUrl),
            parentNodeId: node.id,
            getCache,
            createNode,
            createNodeId,
          })
        } catch (error) {
          console.warn("Dead image link (ignoring):", node.metadata.icon)
          delete node.metadata.icon
        }
      }
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

    // Look for extensions which are not the same, but which have the same artifact id
    // (artifactId is just the 'a' part of the gav, artifact is the whole gav string)

    const relocation = node.metadata.maven?.relocation
    node.isSuperseded = false

    if (relocation) {
      node.duplicates = [{
        artifactId: relocation.artifactId,
        groupId: relocation.groupId,
        slug: extensionSlugFromCoordinates(relocation),
        relationship: "newer",
        differentId: relocation.artifactId !== node.metadata.maven?.artifactId ? relocation.artifactId : relocation.groupId,
        differenceReason: relocation.artifactId !== node.metadata?.maven?.artifactId ? "artifact id" : "group id"
      }]

      node.isSuperseded = true
    }

// Look for things that mark this extension as a duplicate
    const duplicates = extensions.filter(
      ext =>
        ext.metadata.maven?.relocation?.artifactId === node.metadata.maven?.artifactId &&
        ext.metadata.maven?.relocation?.groupId === node.metadata.maven?.groupId
    )
    if (duplicates) {
      const condensedDuplicates = duplicates.map(dupe => {
        // It's possible both might be different, but we've never seen it, so in that case just mention the different artifact id

        return {
          artifact: dupe.artifact,
          artifactId: dupe.metadata.maven?.artifactId,
          groupId: dupe.metadata.maven?.groupId,
          slug: extensionSlug(dupe.artifact),
          relationship: "older",
          differentId: dupe.metadata.maven?.artifactId !== node.metadata.maven?.artifactId ? dupe.metadata.maven?.artifactId : dupe.metadata.maven?.groupId,
          differenceReason: dupe.metadata.maven?.artifactId !== node.metadata?.maven?.artifactId ? "artifact id" : "group id"
        }
      })
      node.duplicates = node.duplicates ? [...condensedDuplicates, ...node.duplicates] : condensedDuplicates

    }

    node.metadata.guide = await rewriteGuideUrl(node)

    if (node.metadata) {
      // Do the link to the download data
      node.metadata.downloads = node.metadata?.maven?.artifactId ? `${node.metadata.maven.groupId}:${node.metadata.maven.artifactId}` : undefined
    }

    return createNode(node)
  })
  return Promise.all(secondPromises)
}

exports.onPreBootstrap = async () => {
  await initMavenCache()
  await initJavadocCache()
  badImages = []
}


exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions

  // Define a template for an extension
  const extensionTemplate = path.resolve(`./src/templates/extension-detail.js`)
  const releaseMonthTemplate = path.resolve(`./src/templates/extensions-added-list.js`)
  const releaseYearTemplate = path.resolve(`./src/templates/extensions-added-by-year-list.js`)

  // Get all extensions
  const result = await graphql(
    `
      {
        allExtension(sort: { fields: [name], order: ASC }) {
          nodes {
            id
            slug
            isSuperseded
            metadata {
              maven {
                sinceMonth
                sinceYear
              }
            }
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

  const extensionNodes = result.data.allExtension.nodes

  // Create extension pages
  // `context` is available in the template as a prop and as a variable in GraphQL

  if (extensionNodes.length > 0) {
    extensionNodes.forEach((extensionNode, index) => {
      const previousPostId = getPreviousPost(index, extensionNodes)
      const nextPostId = getNextPost(index, extensionNodes)

      createPage({
        path: extensionNode.slug,
        component: extensionTemplate,
        context: {
          id: extensionNode.id,
          previousPostId,
          nextPostId,
        },
      })
    })
  }

  const months = [...new Set(extensionNodes.map(extensionNode => extensionNode.metadata?.maven?.sinceMonth))].filter(month => !!month)
  // Always include a page for the current month
  const thisMonth = `${getCanonicalMonthTimestamp(new Date().valueOf())}`
  if (!months.includes(thisMonth)) {
    months.push(thisMonth)
  }
  months.sort()

  months.forEach((month, index, array) => {
    const slug = slugForExtensionsAddedMonth(month)
    const previousMonthTimestamp = array[index - 1]
    const nextMonthTimestamp = array[index + 1]
    createPage({
      path: slug,
      component: releaseMonthTemplate,
      context: {
        sinceMonth: month,
        previousMonthTimestamp,
        nextMonthTimestamp,
      },
    })
  })

  const month = months[months.length - 1]
  // Also include a page for the current month, but do it as its own page, not a redirect so that the link is more shareable
  const slug = slugForExtensionsAddedMonth()
  const previousMonthTimestamp = months[months.length - 2]
  createPage({
    path: slug,
    component: releaseMonthTemplate,
    context: {
      sinceMonth: month,
      previousMonthTimestamp,
    },
  })

  const years = [...new Set(extensionNodes.map(extensionNode => extensionNode.metadata?.maven?.sinceYear))].filter(year => !!year)
  // Always include a page for the current year
  const thisYear = `${getCanonicalYearTimestamp(new Date().valueOf())}`
  if (!years.includes(thisYear)) {
    years.push(thisYear)
  }
  years.sort()

  years.forEach((year, index, array) => {
    const slug = slugForExtensionsAddedYear(year)
    const previousYearTimestamp = array[index - 1]
    const nextYearTimestamp = array[index + 1]
    createPage({
      path: slug,
      component: releaseYearTemplate,
      context: {
        sinceYear: year,
        previousYearTimestamp,
        nextYearTimestamp,
      },
    })
  })
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

exports.onCreateWebpackConfig = ({ stage }) => {
  let plugins
  if (stage === "develop") {
    plugins = [
      new ESLintPlugin({
        extensions: ["js", "jsx", "ts", "tsx"], // | [, "md", "mdx"] or any other files
        emitWarning: true,
        failOnError: false,
      }),
    ]
  }
}

exports.onPostBootstrap = async () => {
  await saveMavenCache()

  const badImageDetails = Object.values(badImages)
  // Write out to a file
  if (badImageDetails?.length > 0) {
    console.warn(`Recording details of ${badImageDetails.length} bad images.`)
    const content = JSON.stringify(badImageDetails)
    const resultsFile = "bad-image-check-results.json"
    await fs.writeFile(resultsFile, content, { flag: "w+" }, err => {
      console.warn("Error writing results:", err)
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
      status: [String]
      builtWithQuarkusCore: String
      quarkus_core_compatibility: String
      unlisted: Boolean
      maven: MavenInfo
      sourceControl: SourceControlInfo @link(by: "key")
      javadoc: JavadocInfo
      icon: File @link(by: "url")
      sponsors: [String]
      sponsor: String
      downloads: DownloadRanking @link(by: "uniqueId")
    }
    
    type MavenInfo {
      url: String
      version: String
      timestamp: String
      since: String
      sinceMonth: String
      sinceYear: String
      relocation: RelocationInfo
    }

    type JavadocInfo {
      url: String
      version: String
      timestamp: String
      relocation: RelocationInfo
    }
        
    type RelocationInfo {
       artifactId: String
    }
 
  `)
  // We use string to represent the timestamp, because otherwise we risk bursting the 32-bit integer limit in graphql

  // What's going on with the @link? https://hashinteractive.com/blog/gatsby-data-relationships-with-foreign-key-fields/ explains


}
