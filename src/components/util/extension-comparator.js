const HOURS_IN_MS = 60 * 60 * 1000

const extensionComparator = (a, b) => {

  const timestampA = roundToTheNearestHour(a?.metadata?.maven?.timestamp)
  const timestampB = roundToTheNearestHour(b?.metadata?.maven?.timestamp)

  if (timestampA && timestampB) {
    const delta = timestampB - timestampA
    if (delta === 0) {
      return compareAlphabetically(a, b)
    } else {
      return delta
    }
  } else if (timestampA) {
    return -1
  } else if (timestampB) {
    return 1
  }
  return compareAlphabetically(a, b)
}

function roundToTheNearestHour(n) {
  if (n) {
    return Math.round(n / HOURS_IN_MS) * HOURS_IN_MS
  }
}

function compareAlphabetically(a, b) {
  if (a.sortableName) {
    return a.sortableName.localeCompare(b.sortableName)
  } else if (b.sortableName) {
    return 1
  } else {
    return 0
  }
}

module.exports = { extensionComparator }