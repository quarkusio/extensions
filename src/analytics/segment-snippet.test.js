import React from "react"
import { segmentSnippet } from "./segment-snippet"

describe("the segment analytics segment", () => {
  const { segmentSnippet } = require("./segment-snippet.js")

  describe("as a raw string", () => {
    it("includes the correct placeholders", () => {
      expect(segmentSnippet).toContain("${writeKey}")
    })
  })
  describe("as code", () => {

    it("is valid javascript", () => {
      // stub out other functions in the plugin that get called
      const gatsbySegmentLoad = jest.fn()
      window.gatsbyPluginSegmentPageviewCaller = jest.fn()
      expect(eval(segmentSnippet))
      expect(gatsbySegmentLoad).toHaveBeenCalled()

    })

    it("honours do not track settings", () => {
      navigator.doNotTrack = 1
      // stub out other functions in the plugin that get called
      const gatsbySegmentLoad = jest.fn()
      window.gatsbyPluginSegmentPageviewCaller = jest.fn()
      expect(eval(segmentSnippet))
      expect(gatsbySegmentLoad).not.toHaveBeenCalled()
    })
  })
})
