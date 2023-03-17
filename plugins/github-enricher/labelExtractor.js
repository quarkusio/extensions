const yaml = require("js-yaml")
const extensionsRegex = /extensions\/(.*)\/?/
const trailingSlash = /\/$/

const labelExtractor = yamlString => {
  const json = yaml.load(yamlString)
  const rules = json?.triage?.rules

  // Turn the rules into a map
  const exactExtensionNamesMap = {}
  const extensionNamePatternsMap = {}

  rules?.forEach(rule => {
    const directories = rule.directories
    directories?.forEach(dir => {
      const extensionMatch = dir.match(extensionsRegex)

      const extensionMaybeWithTrailingSlash = extensionMatch
        ? extensionMatch[1]
        : undefined
      if (extensionMaybeWithTrailingSlash) {
        if (trailingSlash.test(extensionMaybeWithTrailingSlash)) {
          // Strip the trailing slash for ease of matching
          const extension = extensionMaybeWithTrailingSlash.replace(
            trailingSlash,
            ""
          )
          addToMap(exactExtensionNamesMap, extension, rule)
        } else {
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
