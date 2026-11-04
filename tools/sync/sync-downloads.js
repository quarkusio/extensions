/*
 * Fetches the download ranking from Tableau, and writes it to the data directory, where the synced-data gatsby plugin will find it.
 * Needs TABLEAU_PERSONAL_ACCESS_TOKEN and TABLEAU_SITE environment variables.
 */
const { getMostRecentData } = require("./tableau-fetcher")
const { writeDataFile } = require("./data-file")

const main = async () => {
  const data = await getMostRecentData()

  if (data) {
    writeDataFile("download-ranking.json", { date: data.date.toISOString(), ranking: data.ranking })
    console.log("Wrote download ranking for", data.ranking.length, "artifacts.")
  } else {
    // Leave the previous data in place
    console.error("Could not fetch download data; leaving the existing data file unchanged.")
    process.exit(1)
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
