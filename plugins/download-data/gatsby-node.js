const { getMostRecentData } = require("./tableau-fetcher")

const type = "DownloadRanking"

exports.sourceNodes = async ({ actions, createNodeId, createContentDigest }) => {
  const { createNode } = actions

  const allData = await getMostRecentData()

  if (allData) {
    
    createNode({
      date: allData.date,
      id: createNodeId(allData.date.toString()),
      internal: { type: "DownloadDataDate", contentDigest: createContentDigest(allData.date) }
    })

    const promises = allData.ranking.map(artifact =>
      createNode({
        ...artifact,
        id: createNodeId(artifact.artifactId),
        internal: { type, contentDigest: createContentDigest(artifact.artifactId + artifact.rank) }
      })
    )
    // Return a promise to make sure we wait
    return Promise.all(promises)
  }
}

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions
  const typeDefs = `
  type DownloadRanking implements Node {
    artifactId: String
    rank: Int
  }
  
  type DownloadDataDate implements Node {
    date: String
  }
  `
  createTypes(typeDefs)

}