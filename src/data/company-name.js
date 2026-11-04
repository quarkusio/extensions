const redHatIBM = "Red Hat & IBM"

const sanitiseWhitespaceInCompanyName = (companyName) => {
  // Strip out commas and whitespace
  companyName = companyName.replace(",", "")
  return companyName?.trim()
}

const normalizeCompanyName = (company) => {

  if (!company) return

  let companyName = company


  // If multiple companies are listed, just take the first one, because otherwise there could be double-counting contributions
  companyName = companyName.split(/(,|and|&)/)[0]

  // Do some normalisation
  // This is a bit fragile, and we just have to handle patterns as we discover them
  companyName = companyName
    .replace(", Inc.", "")
    .replace(", Inc", "")
    .replace("  GmbH", "")

  // The ? makes the match non-greedy
  const parenthesisMatch = companyName.match(/(.*?) \(.*\)/)
  if (parenthesisMatch) {
    companyName = parenthesisMatch[1]
  }

  const atMatch = companyName.match(/(.*?)( - )?@.*/)
  if (atMatch) {
    companyName = atMatch[1]
  }

  const byMatch = companyName.match(/(.*?) by .*/)
  if (byMatch) {
    companyName = byMatch[1]
  }

  // Special case for some URLs
  companyName = companyName.replace("https://www.redhat.com/", "Red Hat")
  companyName = companyName.replace("http://www.redhat.com/", "Red Hat")

  companyName = sanitiseWhitespaceInCompanyName(companyName)

  // No one wants to see the full IBM name, even though it's the name in the GitHub profile
  companyName = companyName.replace("International Business Machines", "IBM")


  // Special case for some acquisitions
  companyName = companyName.replace("JBoss", "Red Hat")

  if (companyName) {

  }

  companyName = companyName.replace(/^Red Hat/, redHatIBM)
  companyName = companyName.replace(/^IBM/, redHatIBM)

  return companyName
}

module.exports = { normalizeCompanyName, sanitiseWhitespaceInCompanyName }
