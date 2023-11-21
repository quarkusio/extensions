import { segmentSnippet } from "./segment-snippet"

describe("the segment analytics segment", () => {

  describe("as a raw string", () => {
    it("includes the correct placeholders", () => {
      // eslint-disable-next-line no-template-curly-in-string
      expect(segmentSnippet).toContain("${writeKey}")
    })
  })
  describe("as code", () => {

    it("is valid javascript", () => {
      // stub out other functions in the plugin that get called
      const gatsbySegmentLoad = jest.fn()
      window.gatsbyPluginSegmentPageviewCaller = jest.fn()
      eval(segmentSnippet)
      expect(gatsbySegmentLoad).toHaveBeenCalled()

    })

    it("honours do not track settings", () => {
      navigator.doNotTrack = 1
      // stub out other functions in the plugin that get called
      const gatsbySegmentLoad = jest.fn()
      window.gatsbyPluginSegmentPageviewCaller = jest.fn()
      eval(segmentSnippet)
      expect(gatsbySegmentLoad).not.toHaveBeenCalled()
    })
  })
})
