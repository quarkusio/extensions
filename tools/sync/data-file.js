const fs = require("fs")
const path = require("path")

const DATA_DIR = path.resolve(__dirname, "../../data/synced")

const dataPath = name => path.join(DATA_DIR, name)

const readDataFile = (name, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(dataPath(name), "utf8"))
  } catch (e) {
    return fallback
  }
}

// Keys are sorted at every level, and the file is pretty-printed, so that unchanged data produces no diff in git
const sortKeys = value => {
  if (Array.isArray(value)) {
    return value.map(sortKeys)
  } else if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortKeys(value[key])]))
  }
  return value
}

const writeDataFile = (name, data) => {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(dataPath(name), JSON.stringify(sortKeys(data), null, 2) + "\n")
}

module.exports = { readDataFile, writeDataFile, DATA_DIR }
