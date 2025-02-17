const yaml = require("js-yaml")
// If there is a folder between extensions and the folder holding the extension, just ignore it, by using a non-greedy non-capturing group
// I mean, we all love regex, right?
const extensionsRegex = /extensions(?:\/.*?)?\/(.+)\/?/
const trailingSlash = /\/$/

const foldersWhichAreNotExtensions = [
  "api",
  "spi",
  "runtime",
  "deployment",
  "client",
  "server",
]
// Eventually we may want to tack 'client' and 'server' on to the parent folder name, but for now ignore them
// The label-matching logic doesn't use the yaml path. This means special casing that we did for yaml discovery doesn't apply here; for example, the extra smallrye-reactive in some directory name still confuses the label matcher.
// We could rewrite the label matcher to use the yaml path, but a simplistic implementation of that would cause extra, over-general, labels to be pulled in, like smallrye for extensions/smallrye-.
const labelExtractor = (yamlString, repositoryListing) => {
  const json = yaml.load(yamlString)

  const rules = json?.triage?.rules

  // Turn the rules into a map
  const exactExtensionNamesMap = {}
  const extensionNamePatternsMap = {}

  rules?.forEach(rule => {
    const directories = rule.directories

    directories?.forEach(dir => {
      // Also add in anything from the repository listing

      const extensionMatch = dir.match(extensionsRegex)

      const extensionMaybeWithTrailingSlash = extensionMatch
        ? extensionMatch[1]
        : undefined

      // Do a bit of further processing to strip off any directory nesting
      if (extensionMaybeWithTrailingSlash) {
        if (trailingSlash.test(extensionMaybeWithTrailingSlash)) {
          // Strip the trailing slash for ease of matching
          const extension = extensionMaybeWithTrailingSlash.replace(
            trailingSlash,
            ""
          )
          const subdirs = repositoryListing?.find(d => d.name === extension)
            ?.object?.entries
          if (subdirs) {
            // We only want directories, and not the standard ones that we'd find in a top-level extension
            const subExtensions = subdirs
              .filter(
                el =>
                  el.type === "tree" &&
                  !foldersWhichAreNotExtensions.includes(el.name)
              )
              .map(dir => dir.name)
              .map(dir => dir.replace(/^quarkus-/, ""))

            subExtensions.forEach(nestedExtension =>
              addToMap(exactExtensionNamesMap, nestedExtension, rule)
            )
          }

          addToMap(exactExtensionNamesMap, extension, rule)
        } else {
          // We don't handle nested directories in non-exact matched directories, for now
          addToMap(
            extensionNamePatternsMap,
            extensionMaybeWithTrailingSlash,
            rule
          )
        }
      }
    })
  })

  const getLabels = artifactId => {
    const extensionName = artifactId.replace("quarkus-", "")
    let labels = exactExtensionNamesMap[extensionName]
    if (!labels) {
      // look for a match in the patterns map
      const key = Object.keys(extensionNamePatternsMap).find(namePrefix =>
        extensionName.startsWith(namePrefix)
      )
      labels = key ? extensionNamePatternsMap[key] : undefined
    }
    if (!labels) {
      console.warn(
        `Could not work out labels for extension with artifact id`,
        artifactId
      )
    }
    return labels
  }

  return { getLabels }
}

const addToMap = (extensionMap, extensionName, rule) => {
  if (extensionMap[extensionName]) {
    extensionMap[extensionName] = extensionMap[extensionName].concat(
      rule.labels
    )
  } else {
    extensionMap[extensionName] = rule.labels
  }
}

module.exports = { labelExtractor }
