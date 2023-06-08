import { rewriteGuideUrl } from "./guide-url-rewriter"

const urlExist = require("url-exist")
jest.mock("url-exist")

describe("the guide url rewriter", () => {
  beforeEach(() => {
    urlExist.mockReturnValue(true)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("gracefully handles missing data", async () => {
    expect(await rewriteGuideUrl({})).toBeUndefined()
  })

  it("returns the original link for links which exist", async () => {
    const existingLink = "https://exists-great"
    expect(
      await rewriteGuideUrl({
        metadata: {
          guide: existingLink,
        },
      })
    ).toBe(existingLink)
  })

  describe("when links are dead", () => {
    beforeEach(() => {
      urlExist.mockReturnValue(false)
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    // If we can't rewrite a link to be valid by changing a version, and the extension isn't deprecated, pass through the bad link
    // and let the links checker fail the build
    it("does not attempt to rewrite links where there is no mitigation", async () => {
      const badData = "not a link"
      expect(await rewriteGuideUrl({ metadata: { guide: badData } })).toBe(
        badData
      )
    })

    describe("when a link is well-formed but no guide exists at any version", () => {
      const badLink = "https://quarkus.io/guides/nonsense"

      beforeEach(() => {
        urlExist.mockImplementation(() => Promise.resolve(false))
      })

      afterEach(() => {
        jest.clearAllMocks()
      })

      it("does not map the dead link to anything else", async () => {
        expect(
          await rewriteGuideUrl({
            name: "kind-of-dropped-extension",

            metadata: {
              guide: badLink,
              maven: { version: "2.16.0" },
            },
          })
        ).toBe(badLink)
      })
    })

    it("strips nonexistent links in deprecated extensions", async () => {
      expect(
        await rewriteGuideUrl({
          name: "deprecated-extension",
          metadata: {
            status: "deprecated",
            guide: "https://does-not-exist",
          },
        })
      ).toBeUndefined()
    })

    describe("and a valid link exists for a snapshot version", () => {
      const validLink = "https://quarkus.io/version/main/guides/rest-really-new"
      const badLink = "https://quarkus.io/guides/rest-really-new"

      beforeEach(() => {
        urlExist.mockImplementation(url => Promise.resolve(url === validLink))
      })

      afterEach(() => {
        jest.clearAllMocks()
      })

      it("maps dead links to live snapshot links", async () => {
        expect(
          await rewriteGuideUrl({
            name: "hot-off-the-press-extension",
            metadata: {
              guide: badLink,
            },
          })
        ).toBe(validLink)
      })
    })

    describe("and a valid link exists for an older version", () => {
      describe("in quarkus guides format", () => {
        const validLink = "https://quarkus.io/version/2.13/guides/kogito-dmn"
        const badLink = "https://quarkus.io/guides/kogito-dmn"

        beforeEach(() => {
          urlExist.mockImplementation(url => Promise.resolve(url === validLink))
        })

        afterEach(() => {
          jest.clearAllMocks()
        })

        it("maps dead links to live links at the older version", async () => {
          expect(
            await rewriteGuideUrl({
              name: "kind-of-dropped-extension",

              metadata: {
                guide: badLink,
                maven: { version: "2.16.0" },
              },
            })
          ).toBe(validLink)
        })
      })

      describe("in camel format", () => {
        describe("and a valid link exists for an older version", () => {
          const validLink =
            "https://camel.apache.org/camel-quarkus/2.16.x/reference/extensions/sortof-lapsed.html"
          const badLink =
            "https://camel.apache.org/camel-quarkus/latest/reference/extensions/sortof-lapsed.html"

          beforeEach(() => {
            urlExist.mockImplementation(url =>
              Promise.resolve(url === validLink)
            )
          })

          afterEach(() => {
            jest.clearAllMocks()
          })

          it("maps dead links to live links at the older version", async () => {
            expect(
              await rewriteGuideUrl({
                name: "kind-of-dropped-extension",

                metadata: {
                  guide: badLink,
                  maven: { version: "2.16.0" },
                },
              })
            ).toBe(validLink)
          })
        })

        describe("and a valid link exists for a snapshot version", () => {
          const validLink =
            "https://camel.apache.org/camel-quarkus/next/reference/extensions/hot-off-the-press.html"
          const badLink =
            "https://camel.apache.org/camel-quarkus/latest/reference/extensions/hot-off-the-press.html"

          beforeEach(() => {
            urlExist.mockImplementation(url =>
              Promise.resolve(url === validLink)
            )
          })

          afterEach(() => {
            jest.clearAllMocks()
          })

          it("maps dead links to live snapshot links", async () => {
            expect(
              await rewriteGuideUrl({
                name: "hot-off-the-press-extension",
                metadata: {
                  guide: badLink,
                },
              })
            ).toBe(validLink)
          })
        })
      })
    })
  })
})
