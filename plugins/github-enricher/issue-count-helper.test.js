import { getIssueInformationNoCache, initialiseLabels } from "./issue-count-helper"
import { setMinimumContributorCount } from "./sponsorFinder"
import { queryGraphQl } from "./github-helper"
import { labelExtractor } from "./labelExtractor"

jest.mock("./github-helper")
jest.mock("./labelExtractor")

describe("the issue count helper", () => {

  const coords = { owner: "quarkusio", repository: "whatever" }
  const totalCount = 42
  const artifactId = "someArtifact"
  const graphQLResponse = { data: { repository: { issues: { totalCount } } } }

  beforeAll(async () => {
    setMinimumContributorCount(1)

    queryGraphQl.mockResolvedValue(graphQLResponse)
  })

  describe("when the repository is a generic repository", () => {
    const scmUrl = "http://some.repo"

    it("returns an issue count", async () => {
      const { issues } = await getIssueInformationNoCache(coords)
      expect(issues).toBeTruthy()
      expect(issues).toEqual(totalCount)

    })

    it("returns the original url with an issue path", async () => {
      const { issuesUrl } = await getIssueInformationNoCache(coords, artifactId, scmUrl)
      expect(issuesUrl).toEqual(scmUrl + "/issues")
    })

  })
  describe("when the repository is the main quarkus one", () => {
    const scmUrl = "https://github.com/quarkusio/quarkus"
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


    describe("when there are labels", () => {
      const graphQLResponse = { data: { repository: { issues: { totalCount } } } }

      const labels = ["dinosaurs"]
      const getLabels = jest.fn().mockReturnValue(labels)

      beforeAll(async () => {
        labelExtractor.mockReturnValue({ getLabels })
        initialiseLabels()
        queryGraphQl.mockResolvedValue(graphQLResponse)
      })

      it("returns the original url with an issue path", async () => {
        const { issuesUrl } = await getIssueInformationNoCache(coords, artifactId, scmUrl)
        expect(issuesUrl).toMatch(scmUrl + "/issues")
      })

      it("includes the label query in the issue url", async () => {
        const { issuesUrl } = await getIssueInformationNoCache(coords, artifactId, scmUrl)
        expect(issuesUrl).toContain("?q=")
        expect(issuesUrl).toContain("dinosaurs")
      })
    })

    describe("when there are not labels", () => {
      const graphQLResponse = { data: { repository: { issues: { totalCount } } } }

      const getLabels = jest.fn().mockReturnValue()

      beforeAll(async () => {
        labelExtractor.mockReturnValue({ hi: "bye", getLabels })
        initialiseLabels()
        queryGraphQl.mockResolvedValue(graphQLResponse)
      })

      it("returns the original url with an issue path", async () => {
        const { issuesUrl } = await getIssueInformationNoCache(coords, artifactId, scmUrl)
        expect(issuesUrl).toMatch(scmUrl + "/issues")
      })
    })
  })
})