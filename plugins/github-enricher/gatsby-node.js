const gh = require("parse-github-url")
const path = require("path")
const encodeUrl = require("encodeurl")

const { getCache } = require("gatsby/dist/utils/get-cache")
const { createRemoteFileNode } = require("gatsby-source-filesystem")
const { labelExtractor } = require("./labelExtractor")
const PersistableCache = require("./persistable-cache")
const { findSponsor, clearCaches, saveSponsorCache, initSponsorCache } = require("./sponsorFinder")
const { getRawFileContents, queryGraphQl } = require("./github-helper")

const defaultOptions = {
  nodeType: "Extension",
}

// To avoid hitting the git rate limiter retrieving information we already know, cache what we can
const DAY_IN_SECONDS = 24 * 60 * 60
const cacheOptions = { stdTTL: 3 * DAY_IN_SECONDS }
const CACHE_KEY = "github-api-for-repos"
const repoCache = new PersistableCache(cacheOptions)

let getLabels


exports.onPreBootstrap = async ({ cache }) => {
  const cacheContents = await cache.get(CACHE_KEY)
  repoCache.ingestDump(cacheContents)
  console.log("Ingested", repoCache.size(), "cached repositories.")

  initSponsorCache(cache)

  const repoCoords = { owner: "quarkusio", name: "quarkus" }

  const text = await getRawFileContents(repoCoords.owner, repoCoords.name, ".github/quarkus-github-bot.yml")

  const yaml = text ? text : ""

  // This query is long, because I can't find a way to do "or" or
  // Batching this may not help that much because rate limits are done on query complexity and cost,
  // not the number of actual http calls; see https://docs.github.com/en/graphql/overview/resource-limitations
  const query = `
  query {
    repository(owner:"${repoCoords.owner}", name:"${repoCoords.name}") {
     object(expression: "HEAD:extensions") {
      # Top-level.
      ... on Tree {
        entries {
          name
          type
          object {

            # One level down.
            ... on Tree {
              entries {
                name
                type
              }
            }
          }
        }
      }
    }
  }
}`

  const pathsRes = await queryGraphQl(query)
  const repoListing = pathsRes?.repository?.object?.entries

  getLabels = labelExtractor(yaml, repoListing).getLabels

  // Return the promise so the execution waits for us
  return yaml
}

exports.onPostBootstrap = async ({ cache }) => {
  cache.set(CACHE_KEY, repoCache.dump())
  console.log("Persisted", repoCache.size(), "cached repositories.")
  saveSponsorCache(cache)
}

exports.onPluginInit = () => {
  // Clear the cache; we read from the cache later on, so this shouldn't affect the persistence between builds
  // This is mostly needed for tests, since we can't add new methods beyond what the API defines to this file
  repoCache.flushAll()
  clearCaches()
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
  if (scmUrl && scmUrl.includes("github.com")) {
    return fetchGitHubInfo(scmUrl, artifactId, labels)
  } else {
    return { url: scmUrl }
  }
}

function cache(ghJson, scmUrl, hasLabelInfo) {
  // This is a shallow copy but that's ok since the scm info object is pretty flat
  // This copy *should* be unneeded, but better safe than sorry
  const jsonCopy = { ...ghJson }

  // We do *not* want to cache artifact-specific extension paths or the issue count (if there are labels)
  delete jsonCopy["subfolderMetaInfs"]
  delete jsonCopy["shortenedSubfolderMetaInfs"]

  if (hasLabelInfo) {
    delete jsonCopy["issues"]
    delete jsonCopy["issuesUrl"]
  }
  repoCache.set(scmUrl, jsonCopy) // Save this information for the next time
}

const fetchGitHubInfo = async (scmUrl, artifactId, labels) => {
  const hasCache = repoCache.has(scmUrl)

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

  const scmInfo = { url: scmUrl, project }

  scmInfo.sponsors = await findSponsor(coords.owner, project)

  // Always set the issuesUrl and labels since the cached one might be invalid
  scmInfo.issuesUrl = issuesUrl
  scmInfo.labels = labels

  // This query is long, because I can't find a way to do "or" or
  // Batching this may not help that much because rate limits are done on query complexity and cost,
  // not the number of actual http calls; see https://docs.github.com/en/graphql/overview/resource-limitations
  const issuesQuery = `issues(states:OPEN, ${labelFilterString}) {
        totalCount
      }`

  const subfoldersQuery = `subfolderMetaInfs: object(expression: "HEAD:${artifactId}/runtime/src/main/resources/META-INF/") {
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
      }`

  let query
  if (hasCache) {
    // If a repo has labels, we can't just use the issue count for the repo, we need to get the issue count for the specific label
    // We could also cache that, but it's more complicated
    if (labels) {
      query = `query {
        repository(owner:"${coords.owner}", name:"${coords.name}") {
          ${issuesQuery}
          
          ${subfoldersQuery}
          }
    }`
    } else {
      // TODO we could probably drop this in the case where we already had a yaml file at the top level, but we also want to know if there are others at sub-levels,
      // so that we can handle the ambiguity
      query = `query {
        repository(owner:"${coords.owner}", name:"${coords.name}") {          
          ${subfoldersQuery}
          }
    }`
    }
  } else {
    query = `query {
    repository(owner:"${coords.owner}", name:"${coords.name}") {
      ${issuesQuery}
    
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
      
      ${subfoldersQuery}
         
      openGraphImageUrl
    }
    
    repositoryOwner(login: "${coords.owner}") {
        avatarUrl
    }
  }`
  }

  const body = await queryGraphQl(query)

  if (body?.data && body?.data?.repository) {
    const returnedData = body.data
    const cachedData = repoCache.get(scmUrl)
    const returnedRepository = returnedData?.repository
    const cachedRepository = cachedData?.repository

    // Merge the cache and what we got passed back this time
    const data = { ...cachedData, ...returnedData }
    // We also need to do a deep merge of the repository object
    data.repository = { ...cachedRepository, ...returnedRepository }
    cache(data, scmUrl, labels)

    const {
      repository: {
        issues: { totalCount },
        defaultBranchRef,
        metaInfs,
        subfolderMetaInfs,
        shortenedSubfolderMetaInfs,
        openGraphImageUrl,
      },
      repositoryOwner: { avatarUrl },
    } = data

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
      `Cannot read GitHub information for ${artifactId}, because the API did not return any data.`
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
    companies: [String]
    extensionYamlUrl: String
    issues: String
    sponsors: [String]
    socialImage: File @link(by: "url")
    projectImage: File @link(by: "name")
  }
  `
  createTypes(typeDefs)
}
