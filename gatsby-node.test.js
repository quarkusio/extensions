const { default: parse } = require("mvn-artifact-name-parser")

const axios = require("axios")
jest.mock("axios")

const { sourceNodes } = require("./gatsby-node")

const createNode = jest.fn()
const createNodeId = jest.fn()
const createContentDigest = jest.fn()

const resolvedMavenUrl = "http://reallygoodurl.mvn"
const { generateMavenInfo } = require("./src/maven/maven-info")
jest.mock("./src/maven/maven-info")

generateMavenInfo.mockImplementation(artifactId => {
  const coordinates = parse(artifactId)
  // This is totally unscientific and arbitrary, but it's reproducible
  coordinates.timestamp = artifactId.length
  coordinates.url = resolvedMavenUrl
  return coordinates
})

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
      metadata: {
        status: "shaky",
        categories: ["round", "square"],
      },
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

    it("creates extension nodes", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          internal: expect.objectContaining({
            type: "Extension",
          }),
        })
      )
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

    it("sets a status by wrapping the value in an array", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            status: ["shaky"],
          }),
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
          metadata: expect.objectContaining({
            maven: expect.objectContaining({
              url: resolvedMavenUrl,
            }),
          }),
        })
      )
    })

    it("creates a category node", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "round",
          internal: expect.objectContaining({
            type: "Category",
          }),
        })
      )

      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "square",
          internal: expect.objectContaining({
            type: "Category",
          }),
        })
      )
    })
  })

  describe("for an extension with an array of statuses", () => {
    const extension = {
      artifact:
        "io.quarkiverse.micrometer.registry:quarkus-micrometer-registry-datadog::jar:2.12.0",
      origins: [
        "io.quarkus.platform:quarkus-bom-quarkus-platform-descriptor:3.0.0.Alpha3:json:3.0.0.Alpha3",
      ],
      metadata: {
        status: ["questionable", "dodgy"],
      },
    }

    beforeAll(async () => {
      axios.get = jest.fn().mockReturnValue({
        data: {
          extensions: [extension],
          platforms: [],
        },
      })

      await sourceNodes({ actions, createNodeId, createContentDigest })
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    it("passes through the array status", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            status: ["questionable", "dodgy"],
          }),
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

  describe("with unlisted set to false", () => {
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

  describe("for an extension with an other extension sharing the artifact id", () => {
    const extension = {
      artifact:
        "io.quarkiverse.micrometer.registry:quarkus-micrometer-registry-datadog::jar:2.12.0",
      origins: [
        "io.quarkus.platform:quarkus-bom-quarkus-platform-descriptor:3.0.0.Alpha3:json:3.0.0.Alpha3",
      ],
    }
    const olderExtension = {
      artifact:
        "io.quarkelsewhere:quarkus-micrometer-registry-datadog::jar:3.12.0",
      origins: [
        "io.quarkus.platform:quarkus-bom-quarkus-platform-descriptor:3.0.0.Alpha3:json:3.0.0.Alpha3",
      ],
    }

    // A cut down version of what the registry returns us, with just the relevant bits
    const currentPlatforms = {
      platforms: [{}],
    }
    beforeAll(async () => {
      axios.get = jest.fn().mockReturnValue({
        data: {
          extensions: [extension, olderExtension],
          platforms: currentPlatforms.platforms,
        },
      })

      await sourceNodes({ actions, createNodeId, createContentDigest })
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    it("creates ids", () => {
      // It's not easy to do a 'greater than' here, so just hardcode
      expect(createNodeId).toHaveBeenCalledTimes(2)
    })

    it("adds a link to the older extension from the new one", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          artifact: extension.artifact,
          duplicates: [
            expect.objectContaining({
              groupId: "io.quarkelsewhere",
              slug: "io.quarkelsewhere/quarkus-micrometer-registry-datadog",
            }),
          ],
        })
      )
    })

    it("adds a link to the newer extension from the old one", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          artifact: olderExtension.artifact,
          duplicates: [
            expect.objectContaining({
              groupId: "io.quarkiverse.micrometer.registry",
            }),
          ],
        })
      )
    })

    it("marks the older duplicate as older", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          artifact: extension.artifact,
          duplicates: [
            expect.objectContaining({
              relationship: "older",
              timestamp: 65,
            }),
          ],
        })
      )
    })

    it("marks the newer duplicate as newer", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          artifact: olderExtension.artifact,
          duplicates: [
            expect.objectContaining({
              relationship: "newer",
              timestamp: 82,
            }),
          ],
        })
      )
    })

    it("does not mark the newer extension as superseded", () => {
      expect(createNode).not.toHaveBeenCalledWith(
        expect.objectContaining({
          artifact: extension.artifact,
          isSuperseded: true,
        })
      )
    })

    it("marks the older extension as superseded", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          artifact: olderExtension.artifact,
          isSuperseded: true,
        })
      )
    })

    describe("when maven conks out and does not give a timestamp", () => {
      beforeAll(async () => {
        // Clear any history from the parent beforeAll()
        jest.clearAllMocks()

        generateMavenInfo.mockImplementation(artifactId => {
          const coordinates = parse(artifactId)
          // This is totally unscientific and arbitrary, but it's reproducible
          coordinates.timestamp = undefined
          coordinates.url = resolvedMavenUrl
          return coordinates
        })

        axios.get = jest.fn().mockReturnValue({
          data: {
            extensions: [extension, olderExtension],
            platforms: currentPlatforms.platforms,
          },
        })

        await sourceNodes({ actions, createNodeId, createContentDigest })
      })

      it("adds a link to the older extension from the new one", () => {
        expect(createNode).toHaveBeenCalledWith(
          expect.objectContaining({
            artifact: extension.artifact,
            duplicates: [
              expect.objectContaining({
                groupId: "io.quarkelsewhere",
                slug: "io.quarkelsewhere/quarkus-micrometer-registry-datadog",
              }),
            ],
          })
        )
      })

      it("does not mark the new extension as superseded", () => {
        expect(createNode).not.toHaveBeenCalledWith(
          expect.objectContaining({
            artifact: extension.artifact,
            isSuperseded: true,
          })
        )
      })

      it("adds a link to the newer extension from the old one", () => {
        expect(createNode).toHaveBeenCalledWith(
          expect.objectContaining({
            artifact: olderExtension.artifact,
            duplicates: [
              expect.objectContaining({
                groupId: "io.quarkiverse.micrometer.registry",
              }),
            ],
          })
        )
      })

      it("does not mark the older extension as superseded", () => {
        expect(createNode).not.toHaveBeenCalledWith(
          expect.objectContaining({
            artifact: olderExtension.artifact,
            isSuperseded: true,
          })
        )
      })

      it("marks the older duplicate as just different", () => {
        expect(createNode).toHaveBeenCalledWith(
          expect.objectContaining({
            artifact: extension.artifact,
            duplicates: [
              expect.objectContaining({
                relationship: "different",
              }),
            ],
          })
        )
      })

      it("marks the newer duplicate as just different", () => {
        expect(createNode).toHaveBeenCalledWith(
          expect.objectContaining({
            artifact: olderExtension.artifact,
            duplicates: [
              expect.objectContaining({
                relationship: "different",
              }),
            ],
          })
        )
      })
    })
  })
})
