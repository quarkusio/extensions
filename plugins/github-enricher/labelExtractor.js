const yaml = require("js-yaml")
const extensionsRegex = /extensions\/(.*)\/?/

const labelExtractor = yamlString => {
  const json = yaml.load(yamlString)
  const rules = json?.triage?.rules

  // Turn the rules into a map
  const extensionMap = {}
  rules?.forEach(rule => {
    const directories = rule.directories
    directories?.forEach(dir => {
      const extensionMatch = dir.match(extensionsRegex)

      const extensionMaybeWithTrailingSlash = extensionMatch
        ? extensionMatch[1]
        : undefined
      if (extensionMaybeWithTrailingSlash) {
        // Strip a trailing slash, because it's hard to write a regex with a non-greedy optional character
        const extension = extensionMaybeWithTrailingSlash.replace(/\/$/, "")
        if (extensionMap[extension]) {
          console.warn(
            "Several rules applied to a single extension. Ignoring the second rule for ",
            extension
          )
        } else {
          extensionMap[extension] = rule.labels
        }
      }
    })
  })

  const getLabels = artifactId => {
    const extensionName = artifactId.replace("quarkus-", "")
    return extensionMap[extensionName]
  }

  return { getLabels }
}

module.exports = { labelExtractor }
