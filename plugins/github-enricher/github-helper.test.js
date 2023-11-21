const { queryGraphQl, getRawFileContents, queryRest } = require("./github-helper")
const fetchMock = require("jest-fetch-mock")


describe("the github helper", () => {
  beforeAll(() => {
    fetchMock.enableMocks()
  })

  describe("the graphql api helper", () => {
    const response = { data: { toads: "swamps" } }
    const gitHubApi = {
      json: jest.fn().mockResolvedValue(response),
    }

    beforeEach(async () => {
      // Needed so that we do not short circuit the git path
      process.env.GITHUB_TOKEN = "test_value"
      fetch.mockResolvedValue(gitHubApi)
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it("calls github", async () => {
      const query = "query bla bla bla"
      await queryGraphQl(query)
      expect(fetch).toHaveBeenLastCalledWith(
        "https://api.github.com/graphql",
        expect.objectContaining({
          method: "POST",
          body: expect.stringMatching(query),
        })
      )
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    it("adds pagination requests", async () => {
      const query = "query { information(){ edges { bla bla bla}}"
      const queryWithPagination = /query\s*{.*\s*information\(\){\spageInfo {\s*hasNextPage\s*endCursor\s*}\s*edges {\s*bla bla bla}/

      await queryGraphQl(query)
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(sortOutEscapinginQueryString(fetch.mock.calls[0][1].body)).toMatch(queryWithPagination)
    })

    it("returns the api json", async () => {
      const query = "query bla bla bla"
      const answer = await queryGraphQl(query)
      expect(answer).toStrictEqual({ data: { toads: "swamps" } })
    })

    // The JSON stringify of the query string does bad things to the slashes, but I think they're ok when they get decoded at the other end
    const sortOutEscapinginQueryString = (string) => {
      return string.replaceAll("\\n", "").replaceAll("\\\"", "\"")
    }

    describe("when there are multiple pages", () => {

      const otters = { otters: "playful" }
      const lambs = { lambs: "cute" }
      const sheep = { sheep: "woolly" }
      const donkeys = { donkeys: "sweet" }
      const mules = { mules: "grumpy" }
      const zebras = { zebras: "striped" }

      const response1 = {
        data: {
          rateLimit: {
            limit: 5000,
            cost: 1,
            remaining: 727,
            resetAt: "2023-11-02T21:53:43Z"
          },

          holder: {
            information: {
              pageInfo: {
                hasNextPage: true,
                endCursor: "Y3Vyc29yOjEwMA=="
              },
              edges: [otters]
            }
          }
        }
      }
      const response2 = {
        data: {
          holder: {
            information: {
              pageInfo: {
                hasNextPage: true,
                endCursor: "YHGMADEUP=="
              }, edges: [lambs, sheep]
            }
          }
        }
      }
      const response3 = {
        data: {
          holder: {
            information: {
              edges: [donkeys, mules, zebras]
            }
          }
        }
      }
      const response4 = { data: [], }

      beforeEach(async () => {
        // Needed so that we do not short circuit the git path
        process.env.GITHUB_TOKEN = "test_value"
        fetch.mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue(response1),
        }).mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue(response2),
        }).mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue(response3),
        }).mockResolvedValue({
          json: jest.fn().mockResolvedValue(response4),
        })
      })

      afterEach(() => {
        jest.clearAllMocks()
      })

      // Something is a bit dodgy with the mock resetting, so this test needs to be first to work properly
      it("stitches together the api jsons", async () => {
        const query = "query { holder {information{edges { whatever }}}"
        const answer = await queryGraphQl(query)
        expect(answer.data.holder.information.edges).toStrictEqual([otters, lambs, sheep, donkeys, mules, zebras])
      })

      it("makes follow-up calls with a good page reference", async () => {
        const query = "query {      holder {          information{edges { whatever }}"
        const queryWithPagination = /query\s*{.*\s*holder\s*{\s*information\s*{\s*pageInfo {\s*hasNextPage\s*endCursor\s*}\s*edges\s*{\s*whatever }/

        const queryWithPageReference = /query {.*\s*holder\s*{\s*information\(after: "Y3Vyc29yOjEwMA=="\)/
        const queryWithSecondPageReference = /query {.*\s*holder\s*{\s*information\(after: "YHGMADEUP=="\)/

        await queryGraphQl(query)
        expect(fetch).toHaveBeenCalledTimes(3)
        expect(sortOutEscapinginQueryString(fetch.mock.calls[0][1].body)).toMatch(queryWithPagination)
        expect(sortOutEscapinginQueryString(fetch.mock.calls[1][1].body)).toMatch(queryWithPageReference)

        // On the third call, it needs to strip out the earlier after and add the new one
        expect(sortOutEscapinginQueryString(fetch.mock.calls[2][1].body)).toMatch(queryWithSecondPageReference)

      })

      it("correctly handles existing parentheses in the query", async () => {
        const query = "query {  holder{  information(since: something) {edges { whatever }}"
        const queryWithPagination = /query\s*{.*\s*holder\s*{\s*information\(since: something\)\s*{\s*pageInfo {\s*hasNextPage\s*endCursor\s*}\s*edges\s*{\s*whatever }/

        const queryWithPageReference = /query {.*\s*holder\s*{\s*information\(after: "Y3Vyc29yOjEwMA==", since: something\)/
        const queryWithSecondPageReference = /query {.*\s*holder\s*{\s*information\(after: "YHGMADEUP==", since: something\)/

        await queryGraphQl(query)
        expect(fetch).toHaveBeenCalledTimes(3)
        expect(sortOutEscapinginQueryString(fetch.mock.calls[0][1].body)).toMatch(queryWithPagination)
        expect(sortOutEscapinginQueryString(fetch.mock.calls[1][1].body)).toMatch(queryWithPageReference)
        // On the third call, it needs to strip out the earlier after and add the new one
        expect(sortOutEscapinginQueryString(fetch.mock.calls[2][1].body)).toMatch(queryWithSecondPageReference)
      })

      it("parses out github cursors with a space in", async () => {
        // Simulate a plausible second query, with a github-style cursor
        const query = "query { \\n  repository(owner: \"apache\", name: \"camel-quarkus\") {\n    defaultBranchRef{\n        target{\n            ... on Commit{\n                information(after: \"51461900c930fb5ed27b83b52ecd68eaaf1953bc 99\", since: \"2023-04-20T14:57:53.882Z\"){\n                    pageInfo {\n hasNextPage\n      endCursor\n    }\n    edges {\n                        node{\n                            ... on Commit{\n                                author {\n                                  user {\n                                    login\n                                    name\n company\n                                  }\n                                }\n                            }\n                        }\n                    }\n                }\n            }\n        }\n    }\n}\n}"
        await queryGraphQl(query)

        const queryWithPageReference = /information\(after: "Y3Vyc29yOjEwMA==", since: "2023-04-20T14:57:53.882Z"\)/

        expect(sortOutEscapinginQueryString(fetch.mock.calls[1][1].body)).toMatch(queryWithPageReference)
      })

    })
  })

  describe("the rest api helper", () => {
    const response = { frogs: "ponds" }
    const gitHubApi = {
      json: jest.fn().mockResolvedValue(response),
    }

    beforeEach(async () => {
      // Needed so that we do not short circuit the git path
      process.env.GITHUB_TOKEN = "test_value"
      fetch.mockResolvedValue(gitHubApi)
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it("calls github", async () => {
      const endpoint = "frogs/kermit"
      await queryRest(endpoint)
      expect(fetch).toHaveBeenLastCalledWith(
        `https://api.github.com/frogs/kermit`,
        expect.objectContaining({
          method: "GET",
        })
      )
    })

    it("returns the api json", async () => {
      const query = "url bla bla bla"
      const answer = await queryRest(query)
      expect(answer).toStrictEqual({ frogs: "ponds" })
    })
  })

  describe("the raw file helper", () => {
    const contents = "a file contents"
    beforeEach(async () => {
      // Needed so that we do not short circuit the git path
      process.env.GITHUB_TOKEN = "test_value"
      const gitHubApi = {
        text: jest.fn().mockResolvedValue(contents)
      }
      fetch.mockResolvedValue(gitHubApi)

    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it("calls github with the correct url", async () => {
      const org = "quacky"
      const repo = "duck"
      const path = "an-arbitrary-path"
      const expectedUrl = "https://raw.githubusercontent.com/quacky/duck/main/an-arbitrary-path"

      await getRawFileContents(org, repo, path)
      expect(fetch).toHaveBeenLastCalledWith(
        expectedUrl, { "headers": { "Authorization": "Bearer test_value" }, "method": "GET" })
    })

    it("handles double slashes", async () => {
      const org = "quacky"
      const repo = "duck"
      const path = "/bad-path"
      const expectedUrl = "https://raw.githubusercontent.com/quacky/duck/main/bad-path"

      await getRawFileContents(org, repo, path)
      expect(fetch).toHaveBeenLastCalledWith(
        expectedUrl, { "headers": { "Authorization": "Bearer test_value" }, "method": "GET" })
    })


    it("passes back the text contents", async () => {
      const path = "some-path"
      const answer = await getRawFileContents(path)
      expect(answer).toBe(contents)
    })
  })
})