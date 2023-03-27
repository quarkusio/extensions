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
  })
})
