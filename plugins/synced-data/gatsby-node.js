const path = require("path")
const fs = require("fs")
const { createRepository, getResolvers } = require("./repository-creator")
const { getCache } = require("gatsby/dist/utils/get-cache")
const { createRemoteFileNode } = require("gatsby-source-filesystem")
const { normalizeCompanyName } = require("../../src/data/company-name")
// Image urls are signed and expire in minutes, so they cannot be taken from the synced data; we need to ask GitHub again if they have expired
const { getRepoOverviewNoCache } = require("../../tools/sync/scm-info")

// These files are written by the sync tools in tools/sync
const DATA_DIR = path.resolve(__dirname, "../../data/synced")

const readData = (name, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), "utf8"))
  } catch (e) {
    console.warn(`Could not read ${name} from the data directory. Has the sync been run?`)
    return fallback
  }
}

// Setting SKIP_ENRICHMENT ignores the synced data, for faster local builds.
// The schema customization and resolvers stay in place, so the rest of the site still builds,
// it just won't have any source control information.
const skipEnrichment = process.env.SKIP_ENRICHMENT === "true"

const extensionCatalogContributingCompany = "extension-catalog-contributing-company"

exports.sourceNodes = async ({ actions, createNodeId, createContentDigest }) => {
  if (skipEnrichment) {
    return
  }

  await createSourceControlNodes({ actions, createNodeId, createContentDigest })
  createContributingCompanies({ actions, createNodeId, createContentDigest })
  createDownloadNodes({ actions, createNodeId, createContentDigest })
}

/**
 * Helper function to create remote file nodes with retry logic for JWT expiration.
 * GitHub repository image URLs contain JWT tokens that expire after a short time (typically 5 minutes).
 * If the build takes too long between retrieving the URL and fetching the image, the JWT may expire.
 * This function catches JWT expiration errors (HTTP 618) and retries with a fresh URL from GitHub.
 */
const createRemoteFileNodeWithRetry = async (url, options, coords) => {
  try {
    // Strip query parameters from URL for filename to avoid ENAMETOOLONG errors
    const urlWithoutQuery = url.split("?")[0]
    const baseName = path.basename(urlWithoutQuery)

    // Use URL without JWT query params as cache key so Gatsby can reuse cached files
    // even when the JWT token in the URL changes (JWTs expire after 5 minutes)
    const cacheKey = urlWithoutQuery

    return await createRemoteFileNode({
      url,
      ...options,
      name: baseName,
      cacheKey,
    })
  } catch (error) {
    // Log the error to help diagnose JWT detection issues
    console.error(`createRemoteFileNode failed for ${url}:`, {
      message: error.message,
      statusCode: error.statusCode,
      responseStatusCode: error.responseStatusCode,
      responseStatusMessage: error.responseStatusMessage,
      "response?.statusCode": error.response?.statusCode,
      "originalError?.statusCode": error.originalError?.statusCode
    })

    // Check if this is a JWT expiration error
    // Note: gatsby-source-filesystem wraps HTTP errors from 'got', check multiple locations
    const statusCode = error.statusCode ||
      error.originalError?.statusCode ||
      error.response?.statusCode ||
      error.responseStatusCode  // got library uses this property

    const errorMessage = error.message || ""
    const errorString = JSON.stringify(error)

    const isJwtExpired = errorMessage.includes("jwt:expired") ||
      errorMessage.includes("jwt expired") ||
      errorMessage.includes("618") ||
      errorString.includes("jwt:expired") ||
      errorString.includes("618") ||
      statusCode === 618

    if (isJwtExpired && coords) {
      console.warn(`JWT expired for ${url}, retrying with fresh URL from GitHub API`)

      try {
        // Re-fetch fresh URL from GitHub API
        const freshRepoOverview = await getRepoOverviewNoCache(coords)

        if (freshRepoOverview?.socialImage) {
          const urlWithoutQuery = freshRepoOverview.socialImage.split("?")[0]
          const baseName = path.basename(urlWithoutQuery)
          const cacheKey = urlWithoutQuery

          // Retry with fresh URL
          return await createRemoteFileNode({
            url: freshRepoOverview?.socialImage,
            ...options,
            name: baseName,
            cacheKey,
          })
        } else {
          // No fresh URL available (possibly due to rate limiting)
          console.warn(`Could not get fresh image URL for ${coords.owner}/${coords.name}, skipping image`)
          return null
        }
      } catch (retryError) {
        // Retry failed (likely due to GitHub API rate limiting)
        // Instead of crashing the build, skip this image and continue
        console.warn(`Retry failed for ${coords.owner}/${coords.name} (${retryError.message}), skipping image`)
        return null
      }
    }

    // Re-throw if not JWT expiration
    // If it is JWT expiration but we don't have coords to retry, skip the image
    if (isJwtExpired) {
      console.warn(`JWT expired for ${url} but no repository coords available, skipping image`)
      return null
    }

    throw error
  }
}

const createSourceControlNodes = async ({ actions, createNodeId, createContentDigest }) => {
  const { createNode } = actions
  const entries = readData("source-control-info.json", {})

  await Promise.all(Object.entries(entries).map(async ([key, entry]) => {
    const { project, owner, ...scmInfo } = entry

    createRepository({ actions, createNodeId, createContentDigest }, { url: scmInfo.repository, project, owner })

    scmInfo.id = createNodeId(key)
    // We need a non-obfuscated version of the id to act as a foreign key
    scmInfo.key = key

    scmInfo.internal = {
      type: "SourceControlInfo",
      contentDigest: createContentDigest(scmInfo),
    }

    if (scmInfo.socialImage) {
      const fileNode = await createRemoteFileNodeWithRetry(
        scmInfo.socialImage,
        {
          parentNodeId: scmInfo.id,
          getCache,
          createNode,
          createNodeId,
        },
        { owner, name: project }
      )

      // fileNode might be null if JWT expired and retry failed (e.g., due to rate limiting)
      // In that case, we skip the image rather than crashing the build
      if (fileNode) {
        // This is the foreign key to the cropped file's name
        // We have to guess what the name will be
        scmInfo.projectImage = "smartcrop-" + path.basename(fileNode.absolutePath)
      }
    }

    createNode(scmInfo)
  }))
}

const createContributingCompanies = ({ actions, createNodeId, createContentDigest }) => {
  const { namedSponsors, namedContributingOrgs, metadataSponsors } = readData("contributing-companies.json", {})
  const create = (sponsor, source) => createSponsor({ actions, createNodeId, createContentDigest }, { sponsor, source })

  metadataSponsors?.forEach(company => create(company))
  namedSponsors?.forEach(company => create(company, "extension-catalog-sponsor"))
  namedContributingOrgs?.forEach(company => create(company, extensionCatalogContributingCompany))
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

const createDownloadNodes = ({ actions: { createNode }, createNodeId, createContentDigest }) => {
  const allData = readData("download-ranking.json")

  if (allData?.date) {
    // The synced file has an ISO string, but the front end reads the date as epoch millis
    const date = String(new Date(allData.date).getTime())

    createNode({
      date,
      id: createNodeId(date),
      internal: { type: "DownloadDataDate", contentDigest: createContentDigest(date) }
    })

    allData.ranking?.forEach(artifact =>
      createNode({
        ...artifact,
        id: createNodeId(artifact.artifactId),
        internal: { type: "DownloadRanking", contentDigest: createContentDigest(artifact.artifactId + artifact.rank) }
      })
    )
  }
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
    key: String
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
    license: LicenseInfo
  }

  type LicenseInfo {
    name: String
    spdxId: String
    url: String
  }
  
  type SampleInfo implements Node {
    url: String
    description: String 
  }
  
  type DownloadRanking implements Node {
    artifactId: String
    uniqueId: String
    rank: Int
  }

  type DownloadDataDate implements Node {
    date: String
  }

  type Repository implements Node {
    url: String
    owner: String
    project: String
    license: LicenseInfo
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
