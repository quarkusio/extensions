function normaliseUrl(url) {
  return removePlainHttp(removeDoubleSlashes(url))
}

function removePlainHttp(url) {
  return url?.replace("http://github.com", "https://github.com")
}

function removeDoubleSlashes(issuesUrl) {
  return issuesUrl.replace(/(?<!:)\/{2,}/, "/")
}

module.exports = { normaliseUrl }