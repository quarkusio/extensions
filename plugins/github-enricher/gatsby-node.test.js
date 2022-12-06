const { onCreateNode } = require("./gatsby-node")

require("jest-fetch-mock").enableMocks()

const createNodeField = jest.fn(({ node, name, value }) => {
  if (!node.fields) {
    node.fields = {}
  }
  node.fields[name] = value
})
const actions = { createNodeField }
const internal = { type: "extension" }

describe("the preprocessor", () => {
  describe("for an extension with no scm information", () => {
    const metadata = {}

    const node = {
      metadata,
      internal,
    }

    beforeAll(async () => {
      await onCreateNode({ node, actions })
    })

    afterAll(() => {})

    it("changes nothing", async () => {
      expect(node.metadata).toEqual({})
      expect(node.sourceControlInfo).toBeUndefined()
    })

    it("does no remote calls", async () => {
      expect(fetch).not.toHaveBeenCalled()
    })
  })

  describe("for an extension with a scm-url", () => {
    const projectName = "somerepo"
    const url = "http://gitsomething.com/someuser/" + projectName
    const imageUrl = "http://gitsomething.com/someuser.png"

    const gitHubData = {
      json: jest.fn().mockResolvedValue({
        data: {
          repository: {
            issues: {
              totalCount: 16,
            },
          },
        },
      }),
    }
    const metadata = {
      "scm-url": url,
    }

    const node = {
      metadata,
      internal,
    }

    beforeAll(async () => {
      // Needed so that we do not short circuit the git path
      process.env.GRAPHQL_ACCESS_TOKEN = "test_value"
      fetch.mockResolvedValue(gitHubData)
      await onCreateNode({ node, actions })
    })

    afterAll(() => {
      delete process.env.GRAPHQL_ACCESS_TOKEN
    })

    it("creates an scm object", async () => {
      expect(node.fields.sourceControlInfo).toBeTruthy()
    })

    it("copies across the url", async () => {
      expect(node.fields.sourceControlInfo.url).toEqual(url)
    })

    it("fills in an image", async () => {
      expect(node.fields.sourceControlInfo.logoUrl).toEqual(imageUrl)
    })

    it("fills in a project name", async () => {
      expect(node.fields.sourceControlInfo.project).toEqual(projectName)
    })

    it("invokes the github graphql api", async () => {
      expect(fetch).toHaveBeenCalled()
      expect(fetch).toHaveBeenCalledWith(
        "https://api.github.com/graphql",
        expect.objectContaining({
          // This is a bit fragile with the assumptions about whitespace and a bit fiddly with the slashes, but it checks we did a query and got the project name right
          body: expect.stringMatching(/name:\\"somerepo\\"/),
        })
      )
    })

    it("fills in an issue count", async () => {
      expect(node.fields.sourceControlInfo.issues).toEqual(16)
    })
  })
})
