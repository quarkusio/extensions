/**
 * @jest-environment node
 */

const { sourceNodes } = require("./gatsby-node")

const dataFetcher = require("./tableau-fetcher")

jest.mock("./tableau-fetcher")

const stats = {
  date: new Date(),
  ranking: [
    { artifactId: "quarkus-popular", rank: 1 },
    { artifactId: "quarkus-soso", rank: 2 },
    { artifactId: "tools", rank: 3 }]
}
dataFetcher.getMostRecentData.mockResolvedValue(stats)

const contentDigest = "some content digest"
const createNode = jest.fn()
const createNodeId = jest.fn()
const createContentDigest = jest.fn().mockReturnValue(contentDigest)
const actions = { createNode }

describe("the download data supplier", () => {


  beforeAll(async () => {
    await sourceNodes({ createContentDigest, createNodeId, actions })
  })

  it("gets the download data", async () => {
    expect(dataFetcher.getMostRecentData).toHaveBeenCalled()
  })

  it("creates a new node for each artifact", async () => {
    expect(createNode).toHaveBeenCalledWith(
      expect.objectContaining({ artifactId: "tools", rank: 3 })
    )
    expect(createNode).toHaveBeenCalledWith(
      expect.objectContaining({ artifactId: "quarkus-popular", rank: 1 },
      )
    )
  })

  it("adds gatsby metadata to the nodes", async () => {
    const type = "DownloadRanking"
    expect(createNode).toHaveBeenCalledWith(expect.objectContaining({
      internal: { type, contentDigest: expect.anything() }
    }))
  })

})
