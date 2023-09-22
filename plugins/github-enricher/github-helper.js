const promiseRetry = require("promise-retry")
const RETRY_OPTIONS = { retries: 3, minTimeout: 40 * 1000, factor: 3 }

async function tolerantFetch(url, params, isSuccessful, getContents) {
  const accessToken = process.env.GITHUB_TOKEN

  if (accessToken) {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    }
    const body = await promiseRetry(
      async retry => {
        const res = await fetch(url, { ...params, headers }).catch(e => retry(e))
        const ghBody = await getContents(res)

        if (!isSuccessful(ghBody)) {
          retry(
            `Unsuccessful GitHub fetch for ${url} - response is ${JSON.stringify(
              ghBody
            )}`
          )
        }
        return ghBody
      },
      RETRY_OPTIONS
    ).catch(e => {
      // Do not break the build for this, warn and carry on
      console.warn(e)
      return undefined
    })

    if (body?.errors || body?.message) {
      console.warn(
        `Could not get GitHub information for ${url} - response is ${JSON.stringify(
          body
        )}`
      )
      return undefined
    }

    return body
  } else {
    console.warn(
      "Cannot read contributor information, because the environment variable `GITHUB_TOKEN` has not been set."
    )
  }
}


const queryGraphQl = async (query) => {

  return tolerantFetch("https://api.github.com/graphql", {
      method: "POST",
      body: JSON.stringify({ query })
    },
    (ghBody) => ghBody?.data
    , res => res && res.json()
  )

}

const queryRest = async (path) => {
  return await tolerantFetch(`https://api.github.com/${path}`, {
      method: "GET",
    },
    (ghBody) => ghBody,
    res => res && res.json()
  )

}


const getRawFileContents = async (org, repo, path) => {
  // Don't consolidate these two lines or we risk replacing the double slash in http://
  const fullPath = `raw.githubusercontent.com/${org}/${repo}/main/${path}`.replace("//", "/")
  const url = "https://" + fullPath

  return await tolerantFetch(url, {
    method: "GET",
  }, ghBody => ghBody, res => res && res.text())

}

module.exports = { queryGraphQl, queryRest, getRawFileContents }