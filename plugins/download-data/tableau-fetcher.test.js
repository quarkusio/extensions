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
      { uniqueId: "thing:quarkus-popular", groupId: "thing", artifactId: "quarkus-popular", rank: 1 },
      { uniqueId: "thing:quarkus-soso", groupId: "thing", artifactId: "quarkus-soso", rank: 2 },
      { uniqueId: "thing:tools", groupId: "thing", artifactId: "tools", rank: 3 }]

    axios.post.mockResolvedValueOnce({ data: { credentials: { token, site: { id } } } })
    axios.get.mockResolvedValueOnce({ data: { views: { view: [{ id: "view-id" }] } } })
    axios.get.mockResolvedValueOnce({ data: mockTableauOutput })

    const answer = await fetcher.getMostRecentData()
    expect(answer?.ranking).toStrictEqual(expected)
  })

  it("filters out invalid dates", async () => {

    const expected = [
      { uniqueId: "thing:quarkus-popular", groupId: "thing", artifactId: "quarkus-popular", rank: 1 },
      { uniqueId: "thing:quarkus-soso", groupId: "thing", artifactId: "quarkus-soso", rank: 2 },
      { uniqueId: "thing:tools", groupId: "thing", artifactId: "tools", rank: 3 }]

    axios.post.mockResolvedValueOnce({ data: { credentials: { token, site: { id } } } })
    axios.get.mockResolvedValueOnce({ data: { views: { view: [{ id: "view-id" }] } } })
    axios.get.mockResolvedValueOnce({ data: "Group Id,data.artifactId,Month of Data.Date,Year of Data.Date,Data.Timeline\nquarkus-soso,-1,2023,19\n" + mockTableauOutput + "\nquarkus-whatever,whenever,2023,19\n" })

    const answer = await fetcher.getMostRecentData()
    expect(answer?.date).toStrictEqual(new Date("December 2023"))
    expect(answer?.ranking).toStrictEqual(expected)
  })
})

const mockTableauOutput = `Group Id,data.artifactId,Month of Data.Date,Year of Data.Date,Data.Timeline
thing,quarkus-soso,May 2023,2023,19
thing,quarkus-soso,October 2023,2023,21
thing,quarkus-soso,November 2022,2022,23
thing,quarkus-soso,March 2023,2023,28
thing,quarkus-soso,December 2023,2023,370
thing,quarkus-soso,December 2022,2022,39
thing,quarkus-soso,February 2023,2023,44
thing,quarkus-soso,September 2022,2022,45
thing,quarkus-soso,October 2022,2022,45
thing,quarkus-soso,January 2023,2023,54
thing,quarkus-soso,November 2023,2023,54
thing,quarkus-soso,September 2023,2023,57
thing,quarkus-soso,June 2023,2023,61
thing,quarkus-soso,July 2023,2023,81
thing,quarkus-soso,August 2023,2023,96
thing,quarkus-soso,April 2023,2023,115
thing,quarkus-popular,September 2022,2022,88
thing,quarkus-popular,February 2023,2023,89
thing,quarkus-popular,December 2022,2022,98
thing,quarkus-popular,October 2022,2022,100
thing,quarkus-popular,March 2023,2023,100
thing,quarkus-popular,November 2022,2022,107
thing,quarkus-popular,January 2023,2023,131
thing,quarkus-popular,December 2023,2023,"12,890"
thing,quarkus-popular,November 2023,2023,214
thing,quarkus-popular,July 2023,2023,284
thing,quarkus-popular,October 2023,2023,298
thing,quarkus-popular,September 2023,2023,340
thing,quarkus-popular,May 2023,2023,358
thing,quarkus-popular,June 2023,2023,372
thing,quarkus-popular,April 2023,2023,423
thing,quarkus-popular,August 2023,2023,437
thing,tools,January 2023,2023,11
thing,tools,October 2023,2023,14
thing,tools,November 2022,2022,15
thing,tools,December 2023,2023,90
thing,tools,June 2023,2023,34
thing,tools,November 2023,2023,36
thing,tools,December 2022,2022,41
thing,tools,October 2022,2022,45
thing,tools,March 2023,2023,47
thing,tools,September 2022,2022,53
thing,tools,May 2023,2023,65
thing,tools,April 2023,2023,70
thing,tools,July 2023,2023,183
thing,tools,September 2023,2023,195
thing,tools,February 2023,2023,283
thing,tools,August 2023,2023,301
`