const axios = require("axios")
const csv = require("csvtojson")

const serverUrl = "https://10ay.online.tableau.com/api/3.22"
const site = process.env["TABLEAU_SITE"]

// https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_get_started_tutorial_part_1.htm is the useful docs for this
async function getAccessToken() {
  const personalAccessToken = process.env["TABLEAU_PERSONAL_ACCESS_TOKEN"]

  if (personalAccessToken) {
    const tokenUrl = `${serverUrl}/auth/signin`

    const xml = `<tsRequest>
    <credentials 
    personalAccessTokenName="extensions-site"
    personalAccessTokenSecret="${personalAccessToken}" >
      <site contentUrl="${site}" />
    </credentials>
  </tsRequest>`

    const response = await axios.post(tokenUrl, xml)

    return { token: response.data.credentials.token, siteId: response.data.credentials.site.id }
  } else {
    console.log("No TABLEAU_PERSONAL_ACCESS_TOKEN has been set. Not fetching download data.")
  }

}

async function getViewId(accessToken, siteId) {
  // This can almost be read off the web page, but note the extra 'sheets' in the middle
  // https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_concepts_filtering_and_sorting.htm#filter-expressions has guidance on other ways of finding the right view
  // Other fields we could use are
  //       name: 'Downloads Highlight table',
  //       contentUrl: 'Quark-us-iverse-MavenNexusCommunityDownloads/sheets/DownloadsHighlighttable',
  //       viewUrlName: 'DownloadsHighlighttable'
  //     }
  const contentUrl = "Quark-us-iverse-MavenNexusCommunityDownloads/sheets/DownloadsHighlighttable"
  const downloadUrl = `${serverUrl}/sites/${siteId}/views?filter=contentUrl:eq:${contentUrl}`

  const response = await axios.get(downloadUrl, {
    headers: {
      "X-Tableau-Auth": accessToken
    }
  })

  if (!response.data?.views?.view[0]) {
    console.error("Could not find the view with content url", contentUrl)
  }
  return response.data.views.view[0].id
}

async function downloadViewAsCsv(accessToken, siteId, viewId) {
  const downloadUrl = `${serverUrl}/sites/${siteId}/views/${viewId}/data`

  const response = await axios.get(downloadUrl, {
    headers: {
      "X-Tableau-Auth": accessToken
    }
  })

  return response.data
}

const getCsv = async () => {
  const tokenData = await getAccessToken()

  if (tokenData) {
    const { token, siteId } = tokenData
    const viewId = await getViewId(token, siteId)
    return await downloadViewAsCsv(token, siteId, viewId)
  }
}

const convertToNumber = (s) => {
  // We can't call parseInt directly, because Tableau gives us comma-separated strings, and parse int, despite the name, can't handle them.
  return s ? parseInt(s.replaceAll(",", "")) : -1
}

const getMostRecentData = async () => {

  const csvData = await getCsv()

  if (csvData) {
    const json = await csv({
      noheader: false,
      flatKeys: true
    })
      .fromString(csvData)

    // Normalise the headers
    // We are expecting data.artifactId,Month of Data.Date,Year of Data.Date,Data.Timeline
    const withDates = json
      .map(entry => {
        return {
          groupId: entry["Group Id"],
          artifactId: entry["data.artifactId"],
          month: entry["Month of Data.Date"],
          downloads: convertToNumber(entry["Data.Timeline"])
        }
      })
      .map(entry => {
        return { date: new Date(entry.month), ...entry }
      })

    const mostRecentDate = withDates.map(entry => entry.date).filter(date => date.getTime() > 0).sort((a, b) => b - a)[0]

    const onlyMostRecentDownloads = withDates.filter(entry => entry.date.getTime() === mostRecentDate.getTime())
      .sort((a, b) => b.downloads - a.downloads)

    const ranking = onlyMostRecentDownloads.map((entry, i) => {
      return {
        uniqueId: entry.groupId + ":" + entry.artifactId,
        groupId: entry.groupId,
        artifactId: entry.artifactId,
        rank: i + 1
      }
    }).filter(e => e.groupId !== undefined && e.artifactId !== undefined && e.rank !== undefined)

    if (onlyMostRecentDownloads.length !== ranking.length) {
      console.warn((onlyMostRecentDownloads.length - ranking.length), " download data entries had undefined entries, dropping them. Has the schema changed?")
    }
    // Only return download data if we have a non-zero amount
    if (ranking.length > 1) {
      return { date: mostRecentDate, ranking }
    }
  }

}

// Exported for testing
module.exports = { getCsv, getMostRecentData }