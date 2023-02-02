const axios = require("axios")
jest.mock("axios")

const { sourceNodes } = require("./gatsby-node")

const createNode = jest.fn()
const createNodeId = jest.fn()
const createContentDigest = jest.fn()

const { createMavenUrlFromCoordinates } = require("./src/maven/maven-url")
jest.mock("./src/maven/maven-url")

const resolvedMavenUrl = "http://reallygoodurl.mvn"
createMavenUrlFromCoordinates.mockImplementation(coordinates =>
  coordinates ? resolvedMavenUrl : undefined
)

const actions = { createNode }
// A cut down version of what the registry returns us, with just the relevant bits
const currentPlatforms = {
  platforms: [
    {
      "platform-key": "io.quarkus.platform",
      name: "Quarkus Community Platform",
      streams: [
        {
          id: "2.16",
        },
        {
          id: "2.15",
        },
        {
          id: "2.13",
        },
        {
          id: "3.0",
        },
      ],
      "current-stream-id": "2.16",
    },
  ],
}

describe("the main gatsby entrypoint", () => {
  describe("for an extension with no data", () => {
    const extension = {}

    // Be a bit lazy and smoosh the responses from two distinct endpoints into our axios endpoint, since they do not overlap
    beforeAll(async () => {
      axios.get = jest.fn().mockReturnValue({
        data: { extensions: [extension], platforms: currentPlatforms },
      })

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
      origins: [
        "io.quarkus.platform:quarkus-bom-quarkus-platform-descriptor:3.0.0.Alpha3:json:3.0.0.Alpha3",
      ],
    }
    // A cut down version of what the registry returns us, with just the relevant bits
    const currentPlatforms = {
      platforms: [
        {
          "platform-key": "io.quarkus.platform",
          name: "Quarkus Community Platform",
          streams: [
            {
              id: "2.16",
            },
            {
              id: "2.15",
            },
            {
              id: "2.13",
            },
            {
              id: "3.0",
            },
          ],
          "current-stream-id": "2.16",
        },
      ],
    }
    beforeAll(async () => {
      axios.get = jest.fn().mockReturnValue({
        data: {
          extensions: [extension],
          platforms: currentPlatforms.platforms,
        },
      })

      await sourceNodes({ actions, createNodeId, createContentDigest })
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    it("creates an id", () => {
      expect(createNodeId).toHaveBeenCalled()
    })

    it("sets a platform", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          platforms: ["quarkus-bom-quarkus-platform-descriptor"],
        })
      )
    })

    it("sets a stream", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          streams: [
            expect.objectContaining({
              platformKey: "io.quarkus.platform",
              id: "3.0",
            }),
          ],
        })
      )
    })

    it("marks the as stream as current", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          streams: [expect.objectContaining({ isLatestThree: true })],
        })
      )
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

  describe("for an extension in a very old platform", () => {
    const extension = {
      artifact:
        "io.quarkiverse.micrometer.registry:quarkus-micrometer-registry-datadog::jar:2.12.0",
      origins: [
        "io.quarkus.platform:quarkus-bom-quarkus-platform-descriptor:2.2.0:json:2.2.0",
      ],
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

    it("sets a stream", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          streams: [
            expect.objectContaining({
              platformKey: "io.quarkus.platform",
              id: "2.2",
            }),
          ],
        })
      )
    })

    it("marks the as stream as obsolete", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          streams: [expect.objectContaining({ isLatestThree: false })],
        })
      )
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

  // in a handful of the extension yamls, the unlisted is a string, not a boolean. since this is a string, it drives graphQL mad with type anxiety, unless we help.
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
