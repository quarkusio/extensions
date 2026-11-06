/*
 * Finds the external links (javadoc, guides and icons) which the site build would otherwise have to follow, and writes what it finds to the data directory.
 * This uses the same functions that the site build does, and it needs the maven information to have been synced first.
 */
const { fetchExtensions } = require("./extension-list")
const { createJavadocUrlFromCoordinates, initJavadocCache, saveJavadocCache } = require("../../src/javadoc/javadoc-url")
const { rewriteGuideUrl } = require("../../src/components/util/guide-url-rewriter")
const { validate } = require("../../src/data/image-validation")
const { readDataFile, writeDataFile } = require("./data-file")

const LINKS_FILE = "enriched-links.json"

// Following every link at once makes some of the hosts refuse requests, which looks like a dead link
const CONCURRENCY = 8

const runWithConcurrency = async (items, fn) => {
  const queue = [...items]
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      await fn(queue.shift())
    }
  })
  await Promise.all(workers)
}

const main = async () => {
  const extensions = await fetchExtensions()
  const mavenInfo = readDataFile("maven-info.json", {})

  await initJavadocCache()

  const javadoc = {}
  const guides = {}
  const icons = {}

  await runWithConcurrency(extensions, async ({ artifact, name, guide, status, icon }) => {
    const maven = mavenInfo[artifact]

    // Templated coordinates are not real artifacts, and there is nothing to find for them
    if (maven && !artifact.includes("${")) {
      // JSON has no undefined, so a link which does not exist is recorded as null
      javadoc[artifact] = (await createJavadocUrlFromCoordinates(maven)) ?? null
    }

    if (guide) {
      guides[artifact] = (await rewriteGuideUrl({
        name,
        metadata: { guide, status, maven },
        isSuperseded: !!maven?.relocation
      })) ?? null
    }

    if (icon) {
      icons[icon] = await validate(icon)
    }
  })

  writeDataFile(LINKS_FILE, { javadoc, guides, icons })
  console.log("Wrote link information for", Object.keys(javadoc).length, "javadoc links,", Object.keys(guides).length, "guides and", Object.keys(icons).length, "icons.")

  await saveJavadocCache()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
