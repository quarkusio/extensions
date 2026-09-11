import { getIssueInformationNoCache, initialiseLabels } from "./issue-count-helper"
import { setMinimumContributorCount } from "./sponsorFinder"
import { queryGraphQl } from "./github-helper"
import { labelExtractor } from "./labelExtractor"
import { ABSENT, isAbsent } from "../../src/absent"

jest.mock("./github-helper")
jest.mock("./labelExtractor")
jest.mock("url-exist")

describe("the issue count helper", () => {

  const coords = { owner: "quarkusio", name: "whatever" }
  const totalCount = 42
  const artifactId = "some-artifact-with-hyphens"
  const graphQLResponse = { data: { repository: { issues: { totalCount } } } }

  beforeAll(async () => {
    setMinimumContributorCount(1)

    queryGraphQl.mockResolvedValue(graphQLResponse)
  })

  describe("when the repository is a generic repository", () => {
    const scmUrl = "http://some.repo"

    it("returns an issue count", async () => {
      const { issues } = await getIssueInformationNoCache(coords, artifactId, scmUrl)
      expect(issues).toBeTruthy()
      expect(issues).toEqual(totalCount)

    })

    it("returns the original url with an issue path", async () => {
      const { issuesUrl } = await getIssueInformationNoCache(coords, artifactId, scmUrl)
      expect(issuesUrl).toEqual(scmUrl + "/issues")
    })

    it("does not includes the label query in the issue url", async () => {
      const { issuesUrl } = await getIssueInformationNoCache(coords, artifactId, scmUrl)
      expect(issuesUrl).not.toContain("?q=")
      expect(issuesUrl).not.toContain("artifact")
    })

  })
  describe("when the repository is the main quarkus one", () => {
    const scmUrl = "https://github.com/quarkusio/quarkus"
    const graphQLResponse = { data: { repository: { issues: { totalCount } } } }

    beforeAll(async () => {
      setMinimumContributorCount(1)

      queryGraphQl.mockResolvedValue(graphQLResponse)
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

      it("returns an issue count", async () => {
        const { issues } = await getIssueInformationNoCache(coords, artifactId, scmUrl)
        expect(issues).toBeTruthy()
        expect(issues).toEqual(totalCount)

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

      it("includes the label query in graphql query", async () => {
        await getIssueInformationNoCache(coords, artifactId, scmUrl)
        expect(queryGraphQl).toHaveBeenLastCalledWith(expect.stringContaining("dinosaurs"))
      })

      it("includes the repository in graphql query", async () => {
        await getIssueInformationNoCache(coords, artifactId, scmUrl)
        expect(queryGraphQl).toHaveBeenLastCalledWith(expect.stringContaining(coords.name))
      })
    })

    describe("when there are not labels", () => {
      const graphQLResponse = {
        "data": {
          "search": {
            "nodes": [
              {
                "number": 45892
              },
              {
                "number": 46256
              },
              {
                "number": 46047
              },
              {
                "number": 45644
              }]
          }
        }
      }

      const getLabels = jest.fn().mockReturnValue()

      beforeAll(async () => {
        labelExtractor.mockReturnValue({ getLabels })
        initialiseLabels()
        queryGraphQl.mockResolvedValue(graphQLResponse)
      })

      it("returns an issue count", async () => {
        const { issues } = await getIssueInformationNoCache(coords, artifactId, scmUrl)
        expect(issues).toBeTruthy()
        // We only have 4 issues in the data we give back
        expect(issues).toEqual(4)

      })

      it("returns the original url with an issue path", async () => {
        const { issuesUrl } = await getIssueInformationNoCache(coords, artifactId, scmUrl)
        expect(issuesUrl).toMatch(scmUrl + "/issues")
      })

      it("includes the extension name query in the issue url", async () => {
        const { issuesUrl } = await getIssueInformationNoCache(coords, artifactId, scmUrl)
        expect(issuesUrl).toContain("?q=")
        expect(issuesUrl).toContain(artifactId)
      })

      it("includes the repository in graphql query", async () => {
        await getIssueInformationNoCache(coords, artifactId, scmUrl)
        expect(queryGraphQl).toHaveBeenLastCalledWith(expect.stringContaining(coords.name))
      })

      it("includes the artifact id query in graphql query", async () => {
        await getIssueInformationNoCache(coords, artifactId, scmUrl)
        expect(queryGraphQl).toHaveBeenLastCalledWith(expect.stringContaining(artifactId))
      })

    })
  })

  /* If github did not answer, we know nothing about the issues url, and checking it anyway means an
  unauthenticated request to github.com for every affected extension. Those get 429ed, and the
  retries are what used to leave builds apparently hung for hours.
   */
  describe("when github does not answer", () => {
    const scmUrl = "http://some.repo"

    beforeEach(() => {
      queryGraphQl.mockResolvedValue(undefined)
    })

    afterEach(() => {
      queryGraphQl.mockResolvedValue(graphQLResponse)
    })

    // Nothing at all, rather than an empty answer, so that the failure does not get cached as
    // though it were real, and so we do not validate a url we know nothing about
    it("gives back nothing at all", async () => {
      const answer = await getIssueInformationNoCache(coords, artifactId, scmUrl)
      expect(answer).toBeUndefined()
    })

    it("does not report the repository as absent, since it may just be a blip", async () => {
      const answer = await getIssueInformationNoCache(coords, artifactId, scmUrl)
      expect(isAbsent(answer)).toBe(false)
    })
  })

  describe("when the repository has gone away", () => {
    const scmUrl = "http://some.repo"

    beforeEach(() => {
      queryGraphQl.mockResolvedValue(ABSENT)
    })

    afterEach(() => {
      queryGraphQl.mockResolvedValue(graphQLResponse)
    })

    it("reports the absence, so that it can be remembered", async () => {
      const answer = await getIssueInformationNoCache(coords, artifactId, scmUrl)
      expect(isAbsent(answer)).toBe(true)
    })
  })
})