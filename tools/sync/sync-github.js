/*
 * Fetches everything we need from GitHub, and writes it to the data directory, where the synced-data gatsby plugin will find it.
 * Needs a GITHUB_TOKEN environment variable.
 */
const { fetchExtensions } = require("./extension-list")
const { initialise, persist, fetchScmInfoForExtension, fetchNamedCompanies } = require("./scm-info")
const { readDataFile, writeDataFile } = require("./data-file")

const SCM_FILE = "source-control-info.json"
const COMPANIES_FILE = "contributing-companies.json"

const CONCURRENCY = 8

// If GitHub is unhappy with us (rate limits, outages), the fetchers return nothing for the affected fields.
// Carry over the last known values rather than replacing good data with gaps.
const FIELDS_TO_KEEP_IF_MISSING = [
  ["ownerImageUrl"],
  ["issues", "issuesUrl"],
  ["lastUpdated", "contributorsWithFullCompanyInfo", "allCompanies", "numMonthsForContributions", "allSponsors"],
]

const mergeWithPrevious = (fresh, previous) => {
  if (!previous) return fresh

  const merged = { ...fresh }
  FIELDS_TO_KEEP_IF_MISSING.forEach(([marker, ...others]) => {
    if (fresh[marker] === undefined && previous[marker] !== undefined) {
      [marker, ...others].forEach(field => {
        merged[field] = previous[field]
      })
    }
  })
  return merged
}

const runWithConcurrency = async (items, fn) => {
  const queue = [...items]
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      await fn(queue.shift())
    }
  })
  await Promise.all(workers)
}

const syncSourceControl = async (extensions) => {
  const previous = readDataFile(SCM_FILE, {})
  const entries = {}

  const withScm = extensions.filter(extension => extension.sourceControl)
  await runWithConcurrency(withScm, async (extension) => {
    const { sourceControl, groupId, artifactId } = extension
    const fresh = await fetchScmInfoForExtension({ sourceControl, groupId, artifactId })
    if (fresh) {
      entries[sourceControl] = mergeWithPrevious(fresh, previous[sourceControl])
    }
  })

  // Anything in the old file which is not in the registry any more is dropped
  writeDataFile(SCM_FILE, entries)
  console.log("Wrote source control information for", Object.keys(entries).length, "extensions.")
}

const syncCompanies = async (extensions) => {
  const previous = readDataFile(COMPANIES_FILE, {})
  const named = await fetchNamedCompanies()

  const metadataSponsors = [...new Set(extensions.map(extension => extension.sponsor).filter(Boolean))]

  writeDataFile(COMPANIES_FILE, {
    // If the opt-in file could not be read, keep what we had
    namedSponsors: named?.namedSponsors ?? previous.namedSponsors ?? [],
    namedContributingOrgs: named?.namedContributingOrgs ?? previous.namedContributingOrgs ?? [],
    metadataSponsors,
  })
}

const main = async () => {
  if (!process.env.GITHUB_TOKEN) {
    console.error("The environment variable `GITHUB_TOKEN` has not been set, so GitHub information cannot be fetched.")
    process.exit(1)
  }

  const extensions = await fetchExtensions()

  await initialise()
  await syncSourceControl(extensions)
  await syncCompanies(extensions)
  await persist()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
