const { default: parse } = require("mvn-artifact-name-parser")

const axios = require("axios")
jest.mock("axios")

jest.mock("gatsby-source-filesystem")

const imageValidation = require("./src/data/image-validation")
jest.mock("./src/data/image-validation")

const { sourceNodes, createPages } = require("./gatsby-node")

const createNode = jest.fn()
const createNodeId = jest.fn()
const createPage = jest.fn()
const createContentDigest = jest.fn()

const resolvedJavadocUrl = "http://reallygoodurl.javadoc"
const { createJavadocUrlFromCoordinates } = require("./src/javadoc/javadoc-url")
jest.mock("./src/javadoc/javadoc-url")
createJavadocUrlFromCoordinates.mockImplementation(() => {
  return resolvedJavadocUrl
})

const resolvedMavenUrl = "http://reallygoodurl.mvn"

const { generateMavenInfo } = require("./src/maven/maven-info")
jest.mock("./src/maven/maven-info")

const dataCatRelocation = {
  artifactId: "quarkus-micrometer-registry-datadog",
  groupId: "io.quarkiverse.micrometer.registry"
}

generateMavenInfo.mockImplementation(artifactId => {
  const coordinates = parse(artifactId)
  // This is totally unscientific and arbitrary, but it's reproducible
  coordinates.timestamp = artifactId.length
  coordinates.url = resolvedMavenUrl

  // Special case the datacat artifact by doing some hardcoding
  if (artifactId.includes("datacat")) {
    coordinates.relocation = dataCatRelocation
  }

  return coordinates
})

const actions = { createNode, createPage }
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

  describe("creating graphql nodes", () => {

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

      it("adds a javadoc url", () => {
        expect(createNode).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({
              javadoc: expect.objectContaining({
                url: resolvedJavadocUrl,
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

    describe("for an extension with an icon-url", () => {
      const getCache = jest.fn().mockReturnValue({})


      describe("where the icon is a dead link", () => {
        // This test needs to go first, because there's some cross-talk on the mocks I can't quite figure out
        const extension = {
          artifact:
            "io.quarkiverse.micrometer.registry:quarkus-micrometer-registry-datadog::jar:2.12.0",
          metadata: {
            "icon-url": "missing.png"
          }
        }


        beforeAll(async () => {
          jest.mock("axios")
          // First call is the registry data, second is the platforms, third is the contents of the image url
          axios.get = jest.fn().mockReturnValueOnce({
            data: {
              extensions: [extension],
              platforms: [],
            },
          }).mockReturnValueOnce({
            data: {
              extensions: [extension],
              platforms: [],
            },
          }).mockRejectedValueOnce(new Error("missing contents"))

          await sourceNodes({ actions, getCache, createNodeId, createContentDigest })
        })

        afterAll(() => {
          jest.clearAllMocks()
        })

        it("creates a node but without an icon url", () => {
          expect(createNode).not.toHaveBeenCalledWith(
            expect.objectContaining({
              metadata: expect.objectContaining({
                icon: expect.anything(),
              }),
            })
          )
        })
      })

      describe("where the icon points to a valid image", () => {
        const extension = {
          artifact:
            "io.quarkiverse.micrometer.registry:quarkus-micrometer-registry-datadog::jar:2.12.0",
          metadata: {
            "icon-url": "http://valid.png"
          }
        }


        beforeAll(async () => {
          // First call is the registry data, second is the contents of the image url
          axios.get = jest.fn().mockReturnValueOnce({
            data: {
              extensions: [extension],
              platforms: [],
            },
          }).mockReturnValueOnce({
            data: [],
          })

          imageValidation.validate.mockResolvedValue(true)

          await sourceNodes({ actions, getCache, createNodeId, createContentDigest })
        })

        afterAll(() => {
          jest.clearAllMocks()
        })

        it("creates a node with an icon url", () => {
          expect(createNode).toHaveBeenCalledWith(
            expect.objectContaining({
              metadata: expect.objectContaining({
                icon: "http://valid.png",
              }),
            })
          )
        })
      })


      describe("where the icon is a github blob page", () => {
        const blobPath =
          "https://github.com/quarkiverse/quarkus-extension/blob/main/docs/img/nope.png"
        const extension = {
          artifact:
            "io.quarkiverse.micrometer.registry:quarkus-micrometer-registry-datadog::jar:2.12.0",
          origins: [
            "io.quarkus.platform:quarkus-bom-quarkus-platform-descriptor:3.0.0.Alpha3:json:3.0.0.Alpha3",
          ],
          metadata: {
            "icon-url": blobPath
          }
        }


        beforeAll(async () => {
          axios.get = jest.fn().mockReturnValue({
            data: {
              extensions: [extension],
              platforms: [],
            },
          })

          await sourceNodes({ actions, getCache, createNodeId, createContentDigest })
        })

        afterAll(() => {
          jest.clearAllMocks()
        })

        it("creates a node but without an icon url", () => {
          expect(createNode).toHaveBeenCalledWith(
            expect.objectContaining({
              metadata: expect.not.objectContaining({
                icon: expect.anything(),
              }),
            })
          )
        })
      })

      describe("where the icon exists but is corrupted", () => {
        const extension = {
          artifact:
            "io.quarkiverse.micrometer.registry:quarkus-micrometer-registry-datadog::jar:2.12.0",
          origins: [
            "io.quarkus.platform:quarkus-bom-quarkus-platform-descriptor:3.0.0.Alpha3:json:3.0.0.Alpha3",
          ],
          metadata: {
            "icon-url": "invalid.png"
          }
        }


        beforeAll(async () => {
          axios.get = jest.fn().mockReturnValue({
            data: {
              extensions: [extension],
              platforms: [],
            },
          })

          imageValidation.validate.mockResolvedValue(false)

          await sourceNodes({ actions, getCache, createNodeId, createContentDigest })
        })

        afterAll(() => {
          jest.clearAllMocks()
        })

        it("does not creates a node with an icon url", () => {
          expect(createNode).not.toHaveBeenCalledWith(
            expect.objectContaining({
              metadata: expect.objectContaining({
                icon: expect.anything(),
              }),
            })
          )
        })
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

    describe("for an extension with a relocation to another extension", () => {
      const extension = {
        artifact:
          "io.quarkiverse.micrometer.registry:quarkus-micrometer-registry-datadog::jar:2.12.0",
        origins: [
          "io.quarkus.platform:quarkus-bom-quarkus-platform-descriptor:3.0.0.Alpha3:json:3.0.0.Alpha3",
        ],
      }
      const olderExtension = {
        artifact:
          "io.quarkelsewhere:quarkus-micrometer-registry-datacat::jar:3.12.0",
        origins: [
          "io.quarkus.platform:quarkus-bom-quarkus-platform-descriptor:3.0.0.Alpha3:json:3.0.0.Alpha3",
        ]
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

      it("adds a link to the newer extension from the older one", () => {
        expect(createNode).toHaveBeenCalledWith(
          expect.objectContaining({
            artifact: extension.artifact,
            duplicates: [
              expect.objectContaining({
                groupId: "io.quarkelsewhere",
                slug: "io.quarkelsewhere/quarkus-micrometer-registry-datacat",
              }),
            ],
          })
        )
      })

      it("adds a link to the older extension from the new one", () => {
        expect(createNode).toHaveBeenCalledWith(
          expect.objectContaining({
            artifact: olderExtension.artifact,
            duplicates: [
              expect.objectContaining({
                groupId: "io.quarkiverse.micrometer.registry",
                slug: "io.quarkiverse.micrometer.registry/quarkus-micrometer-registry-datadog",
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
              }),
            ],
          })
        )
      })

      it("adds data to the older one explaining what is different", () => {
        expect(createNode).toHaveBeenCalledWith(
          expect.objectContaining({
            artifact: extension.artifact,
            duplicates: [
              expect.objectContaining({
                differenceReason: "artifact id",
                differentId: "quarkus-micrometer-registry-datacat"
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
              }),
            ],
          })
        )
      })

      it("adds data to the newer one explaining what is different", () => {
        expect(createNode).toHaveBeenCalledWith(
          expect.objectContaining({
            artifact: olderExtension.artifact,
            duplicates: [
              expect.objectContaining({
                differenceReason: "artifact id",
                differentId: "quarkus-micrometer-registry-datadog"
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
    })
  })

  describe("creating pages", () => {
    const slug = "sluggy"
    beforeAll(async () => {

      const reporter = () => {
      }
      let graphql = jest.fn().mockResolvedValue({
        data: {
          allExtension: {
            nodes: [{
              slug,
              metadata: { maven: { sinceMonth: "1705250589000" } }
            },
              {
                slug,
                metadata: { maven: { sinceMonth: "1710434589000" } }
              }, {
                slug,
                metadata: { maven: { sinceMonth: "1626566914000" } }
              }]
          }
        }
      })
      await createPages({ graphql, actions, reporter })
    })

    it("creates pages for extensions", () => {
      expect(createPage).toHaveBeenCalledWith(
        expect.objectContaining({ path: slug })
      )
    })

    it("creates pages for release months", () => {
      expect(createPage).toHaveBeenCalledWith(
        expect.objectContaining({ path: "new-extensions/january-2025" })
      )
    })

    it("creates multiple pages for each release months", () => {
      expect(createPage).toHaveBeenCalledWith(
        expect.objectContaining({ path: "new-extensions/july-2021" })
      )
    })

    it("passes through a previous and next", () => {
      expect(createPage).toHaveBeenCalledWith(
        expect.objectContaining({
          context: { nextMonthTimestamp: "1705250589000", sinceMonth: "1626566914000" },
        })
      )

      expect(createPage).toHaveBeenCalledWith(
        expect.objectContaining({
          context: {
            previousMonthTimestamp: "1626566914000",
            sinceMonth: "1705250589000",
            nextMonthTimestamp: "1710434589000"
          },
        })
      )


    })
  })
})
