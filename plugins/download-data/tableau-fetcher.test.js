const fetcher = require("./tableau-fetcher")


const axios = require("axios")
jest.mock("axios")


describe("the tableau data fetcher", () => {
  const token = "1abc"
  const id = "thesite"

  beforeEach(async () => {
    // Set environment variables so we don't short-circuit the execution
    process.env["TABLEAU_PERSONAL_ACCESS_TOKEN"] = "supersecret"
    process.env["TABLEAU_SITE"] = "analytics"
  })


  it("downloads a csv", async () => {
    axios.post.mockResolvedValueOnce({ data: { credentials: { token, site: { id } } } })
    axios.get.mockResolvedValueOnce({ data: { views: { view: [{ id: "view-id" }] } } })
    axios.get.mockResolvedValueOnce({ data: mockTableauOutput })

    const answer = await fetcher.getCsv()
    expect(answer).toStrictEqual(mockTableauOutput)
  })

  it("identifies the correct month to use", async () => {


    axios.post.mockResolvedValueOnce({ data: { credentials: { token, site: { id } } } })
    axios.get.mockResolvedValueOnce({ data: { views: { view: [{ id: "view-id" }] } } })
    axios.get.mockResolvedValueOnce({ data: mockTableauOutput })

    const answer = await fetcher.getMostRecentData()
    expect(answer?.date).toStrictEqual(new Date("December 2023"))
  })

  it("returns data for the most recent month", async () => {

    const expected = [
      { artifactId: "quarkus-popular", rank: 1 },
      { artifactId: "quarkus-soso", rank: 2 },
      { artifactId: "tools", rank: 3 }]

    axios.post.mockResolvedValueOnce({ data: { credentials: { token, site: { id } } } })
    axios.get.mockResolvedValueOnce({ data: { views: { view: [{ id: "view-id" }] } } })
    axios.get.mockResolvedValueOnce({ data: mockTableauOutput })

    const answer = await fetcher.getMostRecentData()
    expect(answer?.ranking).toStrictEqual(expected)
  })

  it("filters out invalid dates", async () => {

    const expected = [
      { artifactId: "quarkus-popular", rank: 1 },
      { artifactId: "quarkus-soso", rank: 2 },
      { artifactId: "tools", rank: 3 }]

    axios.post.mockResolvedValueOnce({ data: { credentials: { token, site: { id } } } })
    axios.get.mockResolvedValueOnce({ data: { views: { view: [{ id: "view-id" }] } } })
    axios.get.mockResolvedValueOnce({ data: "data.artifactId,Month of Data.Date,Year of Data.Date,Data.Timeline\n" + "quarkus-soso,-1,2023,19\n" + mockTableauOutput + "\nquarkus-whatever,whenever,2023,19\n" })

    const answer = await fetcher.getMostRecentData()
    expect(answer?.date).toStrictEqual(new Date("December 2023"))
    expect(answer?.ranking).toStrictEqual(expected)
  })
})

const mockTableauOutput = `data.artifactId,Month of Data.Date,Year of Data.Date,Data.Timeline
quarkus-soso,May 2023,2023,19
quarkus-soso,October 2023,2023,21
quarkus-soso,November 2022,2022,23
quarkus-soso,March 2023,2023,28
quarkus-soso,December 2023,2023,370
quarkus-soso,December 2022,2022,39
quarkus-soso,February 2023,2023,44
quarkus-soso,September 2022,2022,45
quarkus-soso,October 2022,2022,45
quarkus-soso,January 2023,2023,54
quarkus-soso,November 2023,2023,54
quarkus-soso,September 2023,2023,57
quarkus-soso,June 2023,2023,61
quarkus-soso,July 2023,2023,81
quarkus-soso,August 2023,2023,96
quarkus-soso,April 2023,2023,115
quarkus-popular,September 2022,2022,88
quarkus-popular,February 2023,2023,89
quarkus-popular,December 2022,2022,98
quarkus-popular,October 2022,2022,100
quarkus-popular,March 2023,2023,100
quarkus-popular,November 2022,2022,107
quarkus-popular,January 2023,2023,131
quarkus-popular,December 2023,2023,"12,890"
quarkus-popular,November 2023,2023,214
quarkus-popular,July 2023,2023,284
quarkus-popular,October 2023,2023,298
quarkus-popular,September 2023,2023,340
quarkus-popular,May 2023,2023,358
quarkus-popular,June 2023,2023,372
quarkus-popular,April 2023,2023,423
quarkus-popular,August 2023,2023,437
tools,January 2023,2023,11
tools,October 2023,2023,14
tools,November 2022,2022,15
tools,December 2023,2023,90
tools,June 2023,2023,34
tools,November 2023,2023,36
tools,December 2022,2022,41
tools,October 2022,2022,45
tools,March 2023,2023,47
tools,September 2022,2022,53
tools,May 2023,2023,65
tools,April 2023,2023,70
tools,July 2023,2023,183
tools,September 2023,2023,195
tools,February 2023,2023,283
tools,August 2023,2023,301
`