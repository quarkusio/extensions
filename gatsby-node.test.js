const axios = require("axios")
jest.mock("axios")

const { sourceNodes } = require("./gatsby-node")

const createNode = jest.fn()
const createNodeId = jest.fn()
const createContentDigest = jest.fn()

const {
  createMavenUrlFromCoordinates,
} = require("./src/components/util/maven-url")
jest.mock("./src/components/util/maven-url")

const resolvedMavenUrl = "http://reallygoodurl.mvn"
createMavenUrlFromCoordinates.mockImplementation(coordinates =>
  coordinates ? resolvedMavenUrl : undefined
)

const actions = { createNode }

describe("the main gatsby entrypoint", () => {
  describe("for an extension with no data", () => {
    const extension = {}

    beforeAll(async () => {
      axios.get = jest
        .fn()
        .mockReturnValue({ data: { extensions: [extension] } })

      await sourceNodes({ actions, createNodeId, createContentDigest })
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    it("creates a node and fills in empty metadata", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {},
        })
      )
    })

    it("creates an id", () => {
      expect(createNodeId).toHaveBeenCalled()
    })
  })

  describe("for a typical extension", () => {
    const extension = {
      artifact:
        "io.quarkiverse.micrometer.registry:quarkus-micrometer-registry-datadog::jar:2.12.0",
    }

    beforeAll(async () => {
      axios.get = jest
        .fn()
        .mockReturnValue({ data: { extensions: [extension] } })

      await sourceNodes({ actions, createNodeId, createContentDigest })
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    it("creates an id", () => {
      expect(createNodeId).toHaveBeenCalled()
    })

    it("adds a maven url", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            maven: expect.objectContaining({
              url: resolvedMavenUrl,
            }),
          },
        })
      )
    })
  })

  describe("for an extension with unlisted", () => {
    const extension = { metadata: { unlisted: true } }

    beforeAll(async () => {
      axios.get = jest
        .fn()
        .mockReturnValue({ data: { extensions: [extension] } })

      await sourceNodes({ actions, createNodeId, createContentDigest })
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    it("creates a node and fills the correct value for unlisted", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { unlisted: true },
        })
      )
    })

    it("creates an id", () => {
      expect(createNodeId).toHaveBeenCalled()
    })
  })

  describe("for an extension with unlisted set to false", () => {
    const extension = { metadata: { unlisted: false } }

    beforeAll(async () => {
      axios.get = jest
        .fn()
        .mockReturnValue({ data: { extensions: [extension] } })

      await sourceNodes({ actions, createNodeId, createContentDigest })
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    it("creates a node and fills the correct value for unlisted", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { unlisted: false },
        })
      )
    })
  })

  // in a handful of the extension yamls, the unlisted is a string, not a boolean. since this is a string, it drives graphQL made with type anxiety, unless we help.
  describe("for an extension with unlisted as a string", () => {
    const extension = { metadata: { unlisted: "true" } }

    beforeAll(async () => {
      axios.get = jest
        .fn()
        .mockReturnValue({ data: { extensions: [extension] } })

      await sourceNodes({ actions, createNodeId, createContentDigest })
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    it("creates a node and fills the correct value for unlisted", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { unlisted: true },
        })
      )
    })

    it("creates an id", () => {
      expect(createNodeId).toHaveBeenCalled()
    })
  })

  // this *really* shouldn't happen, but if we're doing string to boolean conversion, we need to check false; treating string false as true is a common bug.
  describe("for an extension with unlisted as a false string", () => {
    const extension = { metadata: { unlisted: "false" } }

    beforeAll(async () => {
      axios.get = jest
        .fn()
        .mockReturnValue({ data: { extensions: [extension] } })

      await sourceNodes({ actions, createNodeId, createContentDigest })
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    it("creates a node and fills the correct value for unlisted", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { unlisted: false },
        })
      )
    })

    it("creates an id", () => {
      expect(createNodeId).toHaveBeenCalled()
    })
  })
})
