/*
 * Fetches release dates, relocations and urls for every extension from Maven Central, and writes them to the data directory.
 * This uses the same generateMavenInfo that the site build does.
 */
const { fetchExtensions } = require("./extension-list")
const { generateMavenInfo, initMavenCache, saveMavenCache } = require("../../src/maven/maven-info")
const { initMavenUrlCache, saveMavenUrlCache } = require("../../src/maven/maven-url")
const { readDataFile, writeDataFile } = require("./data-file")

const MAVEN_FILE = "maven-info.json"

// If Maven Central is unhappy with us (rate limits, outages), the lookups return nothing for the affected fields.
// Carry over the last known values rather than replacing good data with gaps.
const FIELDS_TO_KEEP_IF_MISSING = ["timestamp", "earliestVersion", "since", "sinceMonth", "sinceYear"]

const mergeWithPrevious = (fresh, previous) => {
  const merged = { ...fresh }
  FIELDS_TO_KEEP_IF_MISSING.forEach(field => {
    if (fresh[field] === undefined && previous?.[field] !== undefined) {
      merged[field] = previous[field]
    }
  })
  return merged
}

const main = async () => {
  const extensions = (await fetchExtensions()).filter(extension => extension.artifact)
  const previous = readDataFile(MAVEN_FILE, {})
  const entries = {}

  await initMavenCache()
  await initMavenUrlCache()

  await Promise.all(extensions.map(async ({ artifact }) => {
    entries[artifact] = mergeWithPrevious(await generateMavenInfo(artifact), previous[artifact])
  }))

  // Anything in the old file which is not in the registry any more is dropped
  writeDataFile(MAVEN_FILE, entries)
  console.log("Wrote maven information for", Object.keys(entries).length, "extensions.")

  await saveMavenCache()
  await saveMavenUrlCache()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
