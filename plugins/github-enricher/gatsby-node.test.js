const { onCreateNode } = require("./gatsby-node")

// This test relies on a mock in __mocks__. To validate things against
// the real implementation, rename __mocks__/node-geocoder.js to something else temporarily.

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
  })

  describe("for an extension with a scm-url", () => {
    const url = "http://gitsomething.com/someuser/somerepo"
    const imageUrl = "http://gitsomething.com/someuser.png"
    const metadata = {
      "scm-url": url,
    }

    const node = {
      metadata,
      internal,
    }

    beforeAll(async () => {
      await onCreateNode({ node, actions })
    })

    afterAll(() => {})

    it("creates an scm object", async () => {
      expect(node.fields.sourceControlInfo).toBeTruthy()
    })

    it("copies across the url", async () => {
      expect(node.fields.sourceControlInfo.url).toEqual(url)
    })

    it("fills in an image", async () => {
      expect(node.fields.sourceControlInfo.logoUrl).toEqual(imageUrl)
    })

    xit("adds a node for the remote image", async () => {})
  })
})
