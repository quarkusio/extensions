const gh = require("parse-github-url")
const path = require("path")
const encodeUrl = require("encodeurl")
const { createRepository, getResolvers } = require("./repository-creator")

const { getCache } = require("gatsby/dist/utils/get-cache")
const { createRemoteFileNode } = require("gatsby-source-filesystem")
const { labelExtractor } = require("./labelExtractor")
const PersistableCache = require("./persistable-cache")
const {
  findSponsor,
  clearCaches,
  saveSponsorCache,
  initSponsorCache,
  getContributors,
  normalizeCompanyName
} = require("./sponsorFinder")
const { getRawFileContents, queryGraphQl } = require("./github-helper")
const yaml = require("js-yaml")

const defaultOptions = {
  nodeType: "Extension",
}

// To avoid hitting the git rate limiter retrieving information we already know, cache what we can
const DAY_IN_SECONDS = 24 * 60 * 60

// Defer initialization of these so we're playing at the right points in the plugin lifecycle
let imageCache, extensionYamlCache, issueCountCache

let getLabels

exports.onPreBootstrap = async () => {
  imageCache = new PersistableCache({ key: "github-api-for-images", stdTTL: 3 * DAY_IN_SECONDS })

// The location of extension files changes relatively often as extensions get moved or deprecated; to avoid publishing dead links, check often
  extensionYamlCache = new PersistableCache({
    key: "github-api-for-extension-metadata-paths",
    stdTTL: 0.8 * DAY_IN_SECONDS
  })

  issueCountCache = new PersistableCache({
    key: "github-api-for-issue-count",
    stdTTL: 1 * DAY_IN_SECONDS
  })

  await imageCache.ready()
  console.log("Ingested", imageCache.size(), "cached images.")

  await extensionYamlCache.ready()
  console.log("Ingested", extensionYamlCache.size(), "cached metadata file locations.")

  await issueCountCache.ready()
  console.log("Ingested", issueCountCache.size(), "cached issue counts.")

  await initSponsorCache()

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

exports.onPostBootstrap = async () => {
  await imageCache.persist()
  console.log("Persisted", imageCache.size(), "cached repository images.")

  await extensionYamlCache.persist()
  console.log("Persisted", extensionYamlCache.size(), "cached metadata file locations.")

  await issueCountCache.persist()
  console.log("Persisted", issueCountCache.size(), "issue counts.")

  await saveSponsorCache()
}

exports.onPluginInit = () => {
  // Clear the in-memory cache; we read from the gatsby cache later on, so this shouldn't affect the persistence between builds
  // This is mostly needed for tests, since we can't add new methods beyond what the API defines to this file
  imageCache?.flushAll()
  extensionYamlCache?.flushAll()
  issueCountCache?.flushAll()
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

  createSponsor({ actions, createNodeId, createContentDigest }, metadata)

  // A bit ugly, we need a unique identifier in string form, and we also need the url; use a comma-separated string
  const id = metadata?.sourceControl
  let scmUrl = id?.split(",")[0]

  if (scmUrl?.includes("gitbox.apache.org")) {
    const urlState = new URL(scmUrl).search
    const matches = urlState?.match(/p=(.*).git;/)
    const projectName = matches?.length > 0 && matches[1]
    scmUrl = `https://github.com/apache/${projectName}`
  }

  if (scmUrl) {

    const coords = gh(scmUrl)

    const project = coords.name
    const owner = coords.owner

    const labels = await fetchScmLabel(scmUrl, node.metadata?.maven?.artifactId)

    const scmInfo = await fetchScmInfo(
      scmUrl,
      node.metadata?.maven?.groupId,
      node.metadata?.maven?.artifactId,
      labels
    )

    createRepository({ actions, createNodeId, createContentDigest }, { url: scmUrl, project, owner })
    scmInfo.repository = scmUrl

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

exports.sourceNodes = async ({ actions, createNodeId, createContentDigest }) => {
  await createContributingCompanies({ actions, createNodeId, createContentDigest })
}


const extensionCatalogContributingCompany = "extension-catalog-contributing-company"
const createContributingCompanies = async ({ actions, createNodeId, createContentDigest }) => {

  const org = "quarkusio"
  const repo = "quarkus-extension-catalog"
  const path = "named-contributing-orgs-opt-in.yml"

  const yamlString = await getRawFileContents(org, repo, path)

  if (yamlString) {
    const json = await yaml.load(yamlString)

    json["named-sponsors"]?.forEach(company => createSponsor({
      actions,
      createNodeId,
      createContentDigest
    }, { sponsor: company, source: "extension-catalog-sponsor" }))

    json["named-contributing-orgs"]?.forEach(company => createSponsor({
      actions,
      createNodeId,
      createContentDigest
    }, { sponsor: company, source: extensionCatalogContributingCompany }))

  } else {
    console.warn("Could not fetch sponsor opt in information from", org, repo, path, ". Does the file exist?")
  }
}


const createSponsor = ({ actions: { createNode }, createNodeId, createContentDigest }, { sponsor, source }) => {
  if (sponsor) {
    const derivedSource = source || "metadata-sponsor"
    createNode({
      id: sponsor,
      name: sponsor,
      source: derivedSource,
      internal: { type: "ContributingCompany", contentDigest: createContentDigest(sponsor + "sponsor") }
    })
  }
}

async function fetchScmLabel(scmUrl, artifactId) {
  // Special case extensions which live in the quarkus repo; in the future we could generalise,
  // but at the moment we only know how to find a label for quarkus
  if (scmUrl === "https://github.com/quarkusio/quarkus") {
    return getLabels(artifactId)
  }
}

const fetchScmInfo = async (scmUrl, groupId, artifactId, labels) => {
  if (scmUrl && scmUrl.includes("github.com")) {
    return fetchGitHubInfo(scmUrl, groupId, artifactId, labels)
  } else {
    return {}
  }
}


const fetchGitHubInfo = async (scmUrl, groupId, artifactId, labels) => {
  const coords = gh(scmUrl)
  const project = coords.name

  const { issuesUrl, issues } = await getIssueInformation(coords, labels, scmUrl)

  const scmInfo = { issuesUrl, issues }

  scmInfo.labels = labels

  const imageInfo = await getImageInformation(coords, scmUrl)

  if (imageInfo) {
    const { ownerImageUrl, socialImage } = imageInfo

    scmInfo.ownerImageUrl = ownerImageUrl
    scmInfo.socialImage = socialImage
  }


  const metadataInfo = await getMetadataPath(coords, groupId, artifactId, scmUrl)
  if (metadataInfo) {
    const {
      extensionYamlUrl,
      extensionPathInRepo,
      extensionRootUrl
    } = metadataInfo
    scmInfo.extensionYamlUrl = extensionYamlUrl
    scmInfo.extensionPathInRepo = extensionPathInRepo
    scmInfo.extensionRootUrl = extensionRootUrl
  } else {
    console.warn("Could not locate the extension metadata path for", artifactId)
  }

  // scmInfo.extensionPathInRepo may be undefined, but these methods will cope with that
  scmInfo.allSponsors = await findSponsor(coords.owner, project, scmInfo.extensionPathInRepo)
  const {
    contributors,
    lastUpdated,
    companies
  } = await getContributors(coords.owner, project, scmInfo.extensionPathInRepo) ?? {}
  scmInfo.contributorsWithFullCompanyInfo = contributors
  scmInfo.allCompanies = companies
  scmInfo.lastUpdated = lastUpdated

  return scmInfo
}

const getImageInformation = async (coords, scmUrl) => {
  const repoKey = scmUrl
  return await imageCache.getOrSet(repoKey, () => getImageInformationNoCache(coords))
}

const getImageInformationNoCache = async (coords) => {
  const query = `query {
    repository(owner:"${coords.owner}", name:"${coords.name}") {               
      openGraphImageUrl
    }
    
    repositoryOwner(login: "${coords.owner}") {
        avatarUrl
    }
  }`

  const body = await queryGraphQl(query)

  // Don't try and destructure undefined things
  if (body?.data?.repository) {
    const {
      repository: {
        openGraphImageUrl,
      },
      repositoryOwner: {
        avatarUrl
      }
    } = body.data

    const ownerImageUrl = avatarUrl

    // Only look at the social media preview if it's been set by the user; otherwise we know it will be the owner avatar with some text we don't want
    // This mechanism is a bit fragile, but should work for now
    // Default pattern https://opengraph.githubassets.com/3096043220541a8ea73deb5cb6baddf0f01d50244737d22402ba12d665e9aec2/quarkiverse/quarkus-openfga-client
    // Customised pattern https://repository-images.githubusercontent.com/437045322/39ad4dec-e606-4b21-bb24-4c09a4790b58

    const isCustomizedSocialMediaPreview =
      openGraphImageUrl?.includes("githubusercontent")

    let socialImage

    if (isCustomizedSocialMediaPreview) {
      socialImage = openGraphImageUrl
    }

    return { socialImage, ownerImageUrl }
  }

}

const getMetadataPath = async (coords, groupId, artifactId, scmUrl) => {
  const artifactKey = groupId + ":" + artifactId
  const {
    defaultBranchRef,
    extensionYamls
  } = await extensionYamlCache.getOrSet(artifactKey, () => getMetadataPathNoCache(coords, groupId, artifactId)) ?? {}

  // We should only have one extension yaml - if we have more, don't guess, and if we have less, don't set anything
  if (extensionYamls?.length === 1) {

    const extensionYamlPath = extensionYamls[0].path
    const extensionPathInRepo = extensionYamlPath.replace("runtime/src/main/resources/META-INF/quarkus-extension.yaml", "")
    const extensionRootUrl = `${scmUrl}/blob/${defaultBranchRef.name}/${extensionPathInRepo}`
    const extensionYamlUrl = `${scmUrl}/blob/${defaultBranchRef.name}/${extensionYamlPath}`

    return { extensionYamlUrl, extensionPathInRepo, extensionRootUrl }

  } else {
    console.warn(`Could not identify the extension yaml path for ${groupId}:${artifactId}; found `, extensionYamls)
  }
}

const getMetadataPathNoCache = async (coords, groupId, artifactId) => {

  // Some multi-extension projects use just the 'different' part of the name in the folder structure
  const shortArtifactId = artifactId?.replace(coords.name + "-", "")

  const query = `query {
        repository(owner:"${coords.owner}", name:"${coords.name}") {    
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
            
             quarkusSubfolderMetaInfs: object(expression: "HEAD:extensions/${shortArtifactId}/runtime/src/main/resources/META-INF/") {
              ... on Tree {
                entries {
                  path
                }
              }
            }
            
            camelQuarkusCoreSubfolderMetaInfs: object(expression: "HEAD:extensions-core/${shortArtifactId}/runtime/src/main/resources/META-INF/") {
              ... on Tree {
                entries {
                  path
                }
              }
            }
            
            camelQuarkusJvmSubfolderMetaInfs: object(expression: "HEAD:extensions-jvm/${shortArtifactId}/runtime/src/main/resources/META-INF/") {
              ... on Tree {
                entries {
                  path
                }
              }
            }
            
            camelQuarkusSupportSubfolderMetaInfs: object(expression: "HEAD:extensions-support/${shortArtifactId}/runtime/src/main/resources/META-INF/") {
              ... on Tree {
                entries {
                  path
                }
              }
          }
        }
    }`

  const body = await queryGraphQl(query)
  const data = body?.data

  // If we got rate limited, there may not be a repository field
  if (data?.repository) {
    const defaultBranchRef = data.repository.defaultBranchRef

    const allMetaInfs = Object.values(data.repository).map(e => e?.entries).flat()

    return {
      defaultBranchRef, extensionYamls: allMetaInfs.filter(entry =>
        entry?.path.endsWith("/quarkus-extension.yaml")
      )
    }
  }

}

const getIssueInformation = async (coords, labels, scmUrl) => {
  const key = labels ? labels.map(label => `"${label}"`).join() : `${coords.owner}-${coords.name}`
  return await issueCountCache.getOrSet(
    key,
    () => getIssueInformationNoCache(coords, labels, scmUrl)
  )
}

const getIssueInformationNoCache = async (coords, labels, scmUrl) => {

  // TODO we can just treat label as an array, almost
  const labelFilterString = labels
    ? `, filterBy: { labels:  [${labels.map(label => `"${label}"`).join()}] }`
    : ""

  // Tolerate scm urls ending in .git, but don't try and turn them into issues urls without patching
  const topLevelIssuesUrl = (scmUrl + "/issues").replace("\.git/issues", "/issues")
  const issuesUrl = labels
    ? encodeUrl(
      scmUrl +
      "/issues?q=is%3Aopen+is%3Aissue+label%3A" +
      labels.map(label => label.replace("/", "%2F")).join(",")
    )
    : topLevelIssuesUrl

  // Batching this with other queries is not needed because rate limits are done on query complexity and cost,
  // not the number of actual http calls; see https://docs.github.com/en/graphql/overview/resource-limitations
  const query = `query {
          repository(owner:"${coords.owner}", name:"${coords.name}") {
            issues(states:OPEN, ${labelFilterString}) {
                    totalCount
                  }
                }
        }`

  const body = query ? await queryGraphQl(query) : undefined

  // The parent objects may be undefined and destructuring nested undefineds is not good
  const issues = body?.data?.repository?.issues?.totalCount

  return { issues, issuesUrl }
}

// This combines the sponsor opt-in information (which we only fully have after processing all nodes) with the companies and sponsor information for individual nodes,
// to get a sanitised list
exports.createResolvers = ({ createResolvers }) => {
  const other = "Other"

  const resolvers = {
    ...getResolvers(),
    SourceControlInfo: {
      companies: {
        type: "[CompanyContributorInfo]",
        resolve: async (source, args, context) => {

          const answer = await context.nodeModel.findAll({
              type: `ContributingCompany`
            },
          )

          // No need to filter on opt-in source, any named company counts
          const nameableCompanies = Array.from(answer?.entries.map(company => company.name?.toLowerCase()))

          // The case should be the same on the opt in list and GitHub info, but do a case-insensitive comparison to be safe
          const onlyOptIns = source.allCompanies?.map(company => {
            const sanitisedName = nameableCompanies.includes(company.name?.toLowerCase()) ? company.name : other
            return { ...company, name: sanitisedName }
          })

          // We're almost there, but we may have multiple 'other' entries, so aggregate
          const aggregated = onlyOptIns?.reduce((acc, stats) => {
            if (stats.name === other) {
              const existingOther = acc.find(s => s.name === other)
              if (existingOther) {
                existingOther.contributors = existingOther.contributors + stats.contributors
                existingOther.contributions = existingOther.contributions + stats.contributions
              } else {
                acc.push(stats)
              }
            } else {
              acc.push(stats)
            }
            return acc
          }, [])

          return aggregated?.length > 0 ? aggregated : undefined
        }
      },

      contributors: {
        type: "[ContributorInfo]",
        resolve: async (source, args, context) => {

          const optedInCompanies = await context.nodeModel.findAll({
              type: `ContributingCompany`
            },
          )

          // No need to filter on opt-in source, any named company counts
          // Normalise the company name, since the names in the user record will be normalized
          const nameableCompanies = Array.from(optedInCompanies?.entries.map(company => normalizeCompanyName(company.name)).map(companyName => companyName.toLowerCase()))

          // The case should be the same on the opt in list and GitHub info, but do a case-insensitive comparison to be safe
          return source.contributorsWithFullCompanyInfo?.map(contributor => {
            const sanitisedName = nameableCompanies.includes(contributor.company?.toLowerCase()) ? contributor.company : other
            return { ...contributor, company: sanitisedName }
          })


        }
      },

      sponsors: {
        type: "[String]",
        resolve: async (source, args, context) => {

          const answer = await context.nodeModel.findAll({
              type: `ContributingCompany`
            },
          )
          const namedSponsors = Array.from(answer?.entries.filter(company => company.source !== extensionCatalogContributingCompany).map(company => normalizeCompanyName(company.name)).map(companyName => companyName?.toLowerCase()))

          // The case should be the same on the opt in list and GitHub info, but do a normalized case-insensitive comparison to be safe
          // Since this is a filter, we need to use a sync function, but that's ok as we don't need to resolve user ids
          const filtered = source.allSponsors?.filter(company => namedSponsors && namedSponsors.includes(normalizeCompanyName(company).toLowerCase()))
          return filtered?.length > 0 ? filtered : undefined
        }
      }
    }
  }
  createResolvers(resolvers)
}

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions
  const typeDefs = `
  type SourceControlInfo implements Node @noinfer {
    repository: Repository @link(by: "url")
    ownerImageUrl: String
    extensionYamlUrl: String
    extensionRootUrl: String
    issues: String
    lastUpdated: String
    contributors: [ContributorInfo]
    companies: [CompanyContributorInfo]
    allCompanies: [CompanyContributorInfo]
    sponsors: [String]
    allSponsors: [String]
    socialImage: File @link(by: "url")
    projectImage: File @link(by: "name")
  }
  
  type Repository implements Node {
    url: String
    owner: String
    project: String
  }
  
  type ContributorInfo implements Node @noinfer {
    name: String
    login: String
    company: String
    contributions: Int
    url: String
  }
  
  type CompanyContributorInfo implements Node @noinfer {
    name: String
    contributions: Int
  }
  `
  createTypes(typeDefs)
}
