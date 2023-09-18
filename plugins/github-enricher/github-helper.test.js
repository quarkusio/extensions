const { queryGraphQl, getRawFileContents, queryRest } = require("./github-helper")
const fetchMock = require("jest-fetch-mock")


describe("the github helper", () => {
  beforeAll(() => {
    fetchMock.enableMocks()
  })

  describe("the graphql api helper", () => {
    const response = { toads: "swamps" }
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
    })

    it("returns the api json", async () => {
      const query = "query bla bla bla"
      const answer = await queryGraphQl(query)
      expect(answer).toStrictEqual({ toads: "swamps" })
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
      const query = "query bla bla bla"
      const answer = await queryRest(query)
      expect(answer).toStrictEqual({ frogs: "ponds" })
    })
  })

  describe("the raw file helper", () => {
    const contents = "a file contents"
    beforeEach(async () => {
      const gitHubApi = {
        text: jest.fn().mockResolvedValue(contents)
      }
      fetch.mockResolvedValue(gitHubApi)

    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it("calls github with the correct url", () => {
      const org = "quacky"
      const repo = "duck"
      const path = "an-arbitrary-path"
      const expectedUrl = "https://raw.githubusercontent.com/quacky/duck/main/an-arbitrary-path"

      getRawFileContents(org, repo, path)
      expect(fetch).toHaveBeenLastCalledWith(
        expectedUrl)
    })

    it("handles double slashes", () => {
      const org = "quacky"
      const repo = "duck"
      const path = "/bad-path"
      const expectedUrl = "https://raw.githubusercontent.com/quacky/duck/main/bad-path"

      getRawFileContents(org, repo, path)
      expect(fetch).toHaveBeenLastCalledWith(
        expectedUrl)
    })


    it("passes back the text contents", async () => {
      const path = "some-path"
      const answer = await getRawFileContents(path)
      expect(answer).toBe(contents)
    })
  })
})