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
      const existingVersion =
        "https://quarkus.io/version/main/guides/rest-really-new"
      const badVersion = "https://quarkus.io/guides/rest-really-new"

      beforeEach(() => {
        urlExist.mockImplementation(url => url === existingVersion)
      })

      afterEach(() => {
        jest.clearAllMocks()
      })

      it("maps dead links to live snapshot links", async () => {
        expect(
          await rewriteGuideUrl({
            name: "hot-off-the-press-extension",
            metadata: {
              guide: badVersion,
            },
          })
        ).toBe(existingVersion)
      })
    })
  })

  describe("and a valid link exists for an older version", () => {
    const existingVersion =
      "https://camel.apache.org/camel-quarkus/2.16.x/reference/extensions/sortof-lapsed.html"
    const badVersion =
      "https://camel.apache.org/camel-quarkus/latest/reference/extensions/sortof-lapsed.html"

    beforeEach(() => {
      urlExist.mockImplementation(url => url === existingVersion)
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it("maps dead links to live links at the older version", async () => {
      expect(
        await rewriteGuideUrl({
          name: "kind-of-dropped-extension",

          metadata: {
            guide: badVersion,
            maven: { version: "2.16.0" },
          },
        })
      ).toBe(existingVersion)
    })
  })
})
