const knownStatuses = ["stable", "preview", "experimental", "deprecated"]

function adjustedIndex(a) {
  // Slot unknown things just before the end.
  // 1 is for 0-indexing, and 0.5 is to move it before the last entry
  const shifter = 1.5
  return knownStatuses.includes(a)
    ? knownStatuses.indexOf(a)
    : knownStatuses.length - shifter
}

const compareStatus = (a, b) => {
  return adjustedIndex(a) - adjustedIndex(b)
}

module.exports = { compareStatus }
