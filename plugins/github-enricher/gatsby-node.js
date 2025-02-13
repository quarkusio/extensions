const gh = require("parse-github-url")
const path = require("path")
const { createRepository, getResolvers } = require("./repository-creator")

const { getCache } = require("gatsby/dist/utils/get-cache")
const { createRemoteFileNode } = require("gatsby-source-filesystem")
const { labelExtractor } = require("./labelExtractor")
const PersistableCache = require("../../src/persistable-cache")
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
const { getIssueInformationNoCache } = require("./issue-count-helper")
const { normaliseUrl } = require("./url-helper")
const { initialiseLabels } = require("./issue-count-helper")

const defaultOptions = {
  nodeType: "Extension",
}

// To avoid hitting the git rate limiter retrieving information we already know, cache what we can
const DAY_IN_SECONDS = 24 * 60 * 60

// Defer initialization of these so we're playing at the right points in the plugin lifecycle
let imageCache, extensionYamlCache, issueCountCache, samplesCache

let getLabels

exports.onPreBootstrap = async () => {
  imageCache = new PersistableCache({ key: "github-api-for-images", stdTTL: 3 * DAY_IN_SECONDS })

// The location of extension files changes relatively often as extensions get moved or deprecated; to avoid publishing dead links, check often
  extensionYamlCache = new PersistableCache({
    key: "github-api-for-extension-metadata-paths",
    stdTTL: 0.8 * DAY_IN_SECONDS
  })

  samplesCache = new PersistableCache({
    key: "samples-url",
    stdTTL: 5 * DAY_IN_SECONDS
  })

  issueCountCache = new PersistableCache({
    key: "github-api-for-issue-counts",
    stdTTL: DAY_IN_SECONDS
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

  initialiseLabels(yaml, repoListing)
  // Return the promise so the execution waits for us
  return yaml
}

exports.onPostBootstrap = async () => {
  await imageCache.persist()
  console.log("Persisted", imageCache.size(), "cached repository images.")

  await extensionYamlCache.persist()
  console.log("Persisted", extensionYamlCache.size(), "cached metadata file locations.")

  await samplesCache.persist()
  console.log("Persisted", samplesCache.size(), "cached samples folder locations.")

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

    const scmInfo = await fetchScmInfo(
      scmUrl,
      node.metadata?.maven?.groupId,
      node.metadata?.maven?.artifactId,
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

const fetchScmInfo = async (scmUrl, groupId, artifactId, labels) => {
  console.log("fetchScmInfo")
  if (scmUrl && scmUrl.includes("github.com")) {
    return fetchGitHubInfo(scmUrl, groupId, artifactId, labels)
  } else {
    return {}
  }
}

const fetchGitHubInfo = async (scmUrl, groupId, artifactId) => {
  const coords = gh(scmUrl)
  const project = coords.name

  const scmInfo = {}

  console.log("feting ", artifactId)
  const { issuesUrl, issues } = await getIssueInformation(coords, artifactId, scmUrl)

  if (issuesUrl) {
    scmInfo.issuesUrl = issuesUrl
    scmInfo.issues = issues
  }

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
  }

  const samples = await getSamplesPath(coords, groupId, artifactId, scmUrl)
  if (samples && samples.length > 0) {
    scmInfo.samplesUrl = samples
  }

  // scmInfo.extensionPathInRepo may be undefined, but these methods will cope with that
  scmInfo.allSponsors = await findSponsor(coords.owner, project, scmInfo.extensionPathInRepo)
  const {
    contributors,
    lastUpdated,
    numMonthsForContributions,
    companies
  } = await getContributors(coords.owner, project, scmInfo.extensionPathInRepo) ?? {}
  scmInfo.contributorsWithFullCompanyInfo = contributors
  scmInfo.allCompanies = companies
  scmInfo.lastUpdated = lastUpdated
  scmInfo.numMonthsForContributions = numMonthsForContributions

  return scmInfo
}

const getImageInformation = async (coords, scmUrl) => {
  return await imageCache.getOrSet(scmUrl, () => getImageInformationNoCache(coords))
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

const getSamplesPath = async (coords, groupId, artifactId, scmUrl) => {
  const artifactKey = groupId + ":" + artifactId
  return await samplesCache.getOrSet(artifactKey, () => getSamplesPathNoCache(coords, groupId, artifactId, scmUrl)) ?? {}
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
    const extensionRootUrl = normaliseUrl(`${scmUrl}/blob/${defaultBranchRef.name}/${extensionPathInRepo}`)
    const extensionYamlUrl = normaliseUrl(`${scmUrl}/blob/${defaultBranchRef.name}/${extensionYamlPath}`)

    return { extensionYamlUrl, extensionPathInRepo, extensionRootUrl }

  }
  // Warning for the else case is done in the fetching path if we hit the github APIs this run
}

const discoverCamelSamplesPath = async (artifactId) => {
  const shortArtifactId = artifactId?.replace("camel-quarkus-", "")
  const query = `query {
        repository(owner:"apache", name:"camel-quarkus-examples") {    
            defaultBranchRef {
              name
            }
            
            shortenedSubfolderSamples: object(expression: "HEAD:${shortArtifactId}/") {
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

    const allSampleContent = Object.values(data.repository).map(e => e?.entries).flat().filter(e => e?.path != null).map(e => e.path)
    if (allSampleContent.length > 0) {
      const samplesPath = allSampleContent[0].substring(0, allSampleContent[0].indexOf(shortArtifactId) + shortArtifactId.length)

      const samplesUrl = normaliseUrl(`https://github.com/apache/camel-quarkus-examples/blob/${defaultBranchRef.name}/${samplesPath}`)

      // This is a specific sample, so use singular
      return [{ description: "sample", url: samplesUrl }]
    } else {
      return []  // return something, so we can cache it and not thrash the github api
    }
    // If we didn't find one, that's pretty expected, so don't complain
  }
}

const discoverQuarkusCoreQuickstartPath = async (artifactId) => {
  const shortArtifactId = artifactId?.replace("quarkus-", "")
  let quickstartRepoName = `"quarkus-quickstarts"`
  let quickstartOrgName = `"quarkusio"`
  const possibleQuickStartName = `${shortArtifactId}-quickstart`
  const query = `query {
        repository(owner:${quickstartOrgName}, name:${quickstartRepoName}) {    
            defaultBranchRef {
              name
            }
            
            quickstarts: object(expression: "HEAD:${possibleQuickStartName}/") {
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

    const allSampleContent = Object.values(data.repository).map(e => e?.entries).flat().filter(e => e?.path != null).map(e => e.path)
    if (allSampleContent.length > 0) {
      const samplesUrl = normaliseUrl(`https://github.com/quarkusio/quarkus-quickstarts/blob/${defaultBranchRef.name}/${possibleQuickStartName}`)

      return [{ description: "quickstart", url: samplesUrl }]
    } else {
      return []  // return something, so we can cache it and not thrash the github api
    }
    // If we didn't find one, that's pretty expected, so don't complain
  }
}

const discoverSamplesPath = async (artifactId, coords, scmUrl) => {
  // Some multi-extension projects use just the 'different' part of the name in the folder structure
  const shortArtifactId = artifactId?.replace(coords.name + "-", "")

  const query = `query {
        repository(owner:"${coords.owner}", name:"${coords.name}") {    
            defaultBranchRef {
              name
            }
            
            samples: object(expression: "HEAD:samples/") {
              ... on Tree {
                entries {
                  path
                }
              }
            }
            
            subfolderSamples: object(expression: "HEAD:${artifactId}/samples") {
              ... on Tree {
                entries {
                  path
                }
              }
            }
            
            shortenedSubfolderSamples: object(expression: "HEAD:${shortArtifactId}/samples/") {
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

    const allSampleContent = Object.values(data.repository).map(e => e?.entries).flat().filter(e => e?.path?.includes("sample")).map(e => e.path)
    if (allSampleContent.length > 0) {
      const s = allSampleContent[0]
      const samplesPath = s?.substring(0, s.indexOf("samples") + "samples".length)

      const samplesUrl = normaliseUrl(`${scmUrl}/blob/${defaultBranchRef.name}/${samplesPath}`)

      return [{ description: "samples", url: samplesUrl }]
    } else {
      return []  // return something, so we can cache it and not thrash the github api
    }
    // If we didn't find one, that's pretty expected, so don't complain
  }
}

const getSamplesPathNoCache = async (coords, groupId, artifactId, scmUrl) => {


  if (artifactId?.startsWith("camel-quarkus")) {
    return discoverCamelSamplesPath(artifactId)
  } else if (coords?.owner === "quarkusio" && coords.name === "quarkus") {
    return discoverQuarkusCoreQuickstartPath(artifactId)
  } else {
    return await discoverSamplesPath(artifactId, coords, scmUrl)
  }

}

const getMetadataPathNoCache = async (coords, groupId, artifactId) => {

  // Some multi-extension projects use just the 'different' part of the name in the folder structure
  const shortArtifactId = artifactId?.replace(coords.name + "-", "")

  // Some projects just use a single word for the project names, such as the Amazon and Google extensions
  const elements = artifactId?.split("-")
  const oneWordArtifactId = elements && elements[elements.length - 1]

  const isCamel = groupId?.includes("camel")

  const query = isCamel ? `query {
    repository(owner:"${coords.owner}", name:"${coords.name}") {
      defaultBranchRef {
        name
      }

      camelQuarkusSubfolderMetaInfs: object(expression: "HEAD:extensions/${shortArtifactId}/runtime/src/main/resources/META-INF/") {
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
  }` : `query {
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

            oneWordSubfolderMetaInfs: object(expression: "HEAD:${oneWordArtifactId}/runtime/src/main/resources/META-INF/") {
              ... on Tree {
                entries {
                  path
                }
              }
            }
            
            filteredSubfolderMetaInfs: object(expression: "HEAD:${artifactId}/runtime/src/main/resources-filtered/META-INF/") {
              ... on Tree {
                entries {
                  path
                }
              }
            }
            
            filteredShortenedSubfolderMetaInfs: object(expression: "HEAD:${shortArtifactId}/runtime/src/main/resources-filtered/META-INF/") {
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
        }
   }`

  const body = await queryGraphQl(query)
  const data = body?.data

  // If we got rate limited, there may not be a repository field
  if (data?.repository) {
    const defaultBranchRef = data.repository.defaultBranchRef

    const allMetaInfs = Object.values(data.repository).map(e => e?.entries).flat()

    const extensionYamls = allMetaInfs.filter(entry =>
      entry?.path.endsWith("/quarkus-extension.yaml")
    )
    const answer = { defaultBranchRef, extensionYamls }
    if (extensionYamls.length !== 0) {
      console.warn(`Could not identify the extension yaml path for ${groupId}:${artifactId} (no results). `)
    } else if (extensionYamls.length > 1) {
      console.warn(`Too many candidate extension yaml paths for ${groupId}:${artifactId}; found `, extensionYamls)
    }
    return answer
  }

}

const getIssueInformation = async (coords, artifactId, scmUrl) => {
  const key = `${coords.owner}-${coords.name}-${artifactId}`

  return await issueCountCache.getOrSet(
    key,
    () => getIssueInformationNoCache(coords, artifactId, scmUrl)
  )

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
    issuesUrl: String
    samplesUrl: [SampleInfo]
    lastUpdated: String
    contributors: [ContributorInfo]
    companies: [CompanyContributorInfo]
    allCompanies: [CompanyContributorInfo]
    sponsors: [String]
    allSponsors: [String]
    socialImage: File @link(by: "url")
    projectImage: File @link(by: "name")
    numMonthsForContributions: Int
  }
  
  type SampleInfo implements Node {
    url: String
    description: String 
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
