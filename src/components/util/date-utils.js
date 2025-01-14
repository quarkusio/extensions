const getCanonicalMonthTimestamp = (since) => {
  const trimmed = new Date(since)
// Set the day of the month to 1 because days are 1-indexed
  trimmed.setUTCDate(1) // Days of the month, despite the unexpected name
  trimmed.setUTCHours(6) // Add some hours to the hours so daylight savings doesn't knock the month back into the previous one
  trimmed.setUTCMinutes(0)
  trimmed.setUTCSeconds(0)
  trimmed.setUTCMilliseconds(0)
  return trimmed.valueOf()
}

const dateFormatOptions = { year: "numeric", month: "long", timeZone: "Europe/London" }

module.exports = { getCanonicalMonthTimestamp, dateFormatOptions }
