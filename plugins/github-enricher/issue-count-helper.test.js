import { getIssueInformationNoCache } from "./issue-count-helper"
import { setMinimumContributorCount } from "./sponsorFinder"
import { queryGraphQl } from "./github-helper"

jest.mock("./github-helper")

describe("the issue count helper", () => {

  const coords = { owner: "quarkusio", repository: "whatever" }
  const totalCount = 42
  const scmUrl = "http://some.repo"
  const graphQLResponse = { data: { repository: { issues: { totalCount } } } }

  beforeAll(async () => {
    setMinimumContributorCount(1)

    queryGraphQl.mockResolvedValue(graphQLResponse)
  })

  it("returns an issue count", async () => {
    const { issues } = await getIssueInformationNoCache(coords)
    expect(issues).toBeTruthy()
    expect(issues).toEqual(totalCount)

  })

  describe("when there are no labels", () => {
    const graphQLResponse = { data: { repository: { issues: { totalCount } } } }

    beforeAll(async () => {
      setMinimumContributorCount(1)

      queryGraphQl.mockResolvedValue(graphQLResponse)
    })
    it("returns the original url with an issue path", async () => {
      const { issuesUrl } = await getIssueInformationNoCache(coords, undefined, scmUrl)
      expect(issuesUrl).toEqual(scmUrl + "/issues")
    })
  })

  describe("when there are labels", () => {
    const graphQLResponse = { data: { repository: { issues: { totalCount } } } }
    const labels = ["dinosaurs"]

    beforeAll(async () => {
      setMinimumContributorCount(1)

      queryGraphQl.mockResolvedValue(graphQLResponse)
    })

    it("returns the original url with an issue path", async () => {
      const { issuesUrl } = await getIssueInformationNoCache(coords, labels, scmUrl)
      expect(issuesUrl).toMatch(scmUrl + "/issues")
    })

    it("includes the label query in the issue url", async () => {
      const { issuesUrl } = await getIssueInformationNoCache(coords, labels, scmUrl)
      expect(issuesUrl).toContain("?q=")
      expect(issuesUrl).toContain("dinosaurs")
    })
  })
})