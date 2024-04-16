import React from "react"
import { render, screen } from "@testing-library/react"
import KeywordFilter from "./keyword-filter"
import { useQueryParamString } from "react-use-query-param-string"
import userEvent from "@testing-library/user-event"

let mockQueryParamSearchString = undefined
let rerender = undefined

jest.mock("react-use-query-param-string", () => {

  const original = jest.requireActual("react-use-query-param-string")
  const setQueryParam = jest.fn().mockImplementation((val) => {
    mockQueryParamSearchString = val
  })
  return {
    ...original,
    useQueryParamString: jest.fn().mockImplementation(() => [mockQueryParamSearchString, setQueryParam, true]),
  }
})

describe("keyword filter", () => {
  let user
  const filterer = jest.fn(() => {
    // cheat, since normally the parent will force a rerender, and the child does not use usestate to avoid infinite loops
    if (rerender) {
      try {
        rerender()
      } catch (e) {
        // This can happen if the component is already unmounted, and isn't something we want to worry about it
      }
    }
  })
  const keywords = ["toad", "tadpole", "treefrog"]

  describe("when the query string starts blank", () => {

    beforeEach(() => {
      user = userEvent.setup()
      mockQueryParamSearchString = undefined
      const products = render(<KeywordFilter filterer={filterer} keywords={keywords} />)
      rerender = () => products.rerender(<KeywordFilter filterer={filterer} keywords={keywords} />)
    })

    it("renders a keywords title", () => {
      expect(screen.getByText("Keyword")).toBeTruthy()
    })

    it("renders prettified individual keywords", () => {
      expect(screen.getByText("Toad")).toBeTruthy()
      expect(screen.getByText("Tadpole")).toBeTruthy()
    })

    it("renders tickboxes", () => {
      expect(screen.getAllByTitle("unticked")).toHaveLength(keywords.length)
    })

    describe("when clicking a ticky box", () => {
      const keywordName = "Treefrog"
      beforeEach(async () => {
        await user.click(screen.getByText(keywordName))
      })

      it("passes through the original keyword to the listener", () => {
        expect(filterer).toHaveBeenCalledWith([keywordName.toLowerCase()])
      })

      it("updates the ticky box icons", async () => {
        expect(screen.getByTitle("ticked")).toBeTruthy()
        expect(screen.getAllByTitle("unticked")).toHaveLength(
          keywords.length - 1
        )
      })

      it("sets search parameters", async () => {

        const [, setQueryParam] = useQueryParamString()

        expect(setQueryParam).toHaveBeenCalledWith(keywordName.toLowerCase())
      })
    })

    describe("when clicking several ticky boxes", () => {
      const keywordName = "Treefrog"
      const otherName = "Toad"
      beforeEach(async () => {
        await user.click(screen.getByText(keywordName))
        await user.click(screen.getByText(otherName))
      })

      it("passes through the keywords to the listener", () => {
        expect(filterer).toHaveBeenCalledWith([
          keywordName.toLowerCase(),
          otherName.toLowerCase(),
        ])
      })

      it("updates the ticky box icons", () => {
        expect(screen.getAllByTitle("unticked")).toHaveLength(
          keywords.length - 2
        )
        expect(screen.getAllByTitle("ticked")).toHaveLength(2)
      })

      it("sets search parameters", async () => {

        const [, setQueryParam] = useQueryParamString()

        expect(setQueryParam).toHaveBeenCalledWith(keywordName.toLowerCase() + "," + otherName.toLowerCase())
      })
    })

    describe("when un-clicking a ticky box", () => {
      const keywordName = "Treefrog"
      beforeEach(async () => {
        await user.click(screen.getByText(keywordName))
        await user.click(screen.getByText(keywordName))
      })

      it("passes through the filter to the listener", () => {
        expect(filterer).toHaveBeenCalledWith([keywordName.toLowerCase()])
        expect(filterer).toHaveBeenCalledWith([])
      })

      it("updates the ticky box icons to go back to unticked", () => {
        expect(screen.queryAllByTitle("ticked")).toHaveLength(0)
        expect(screen.getAllByTitle("unticked")).toHaveLength(keywords.length)
      })

      it("unsets search parameters", async () => {
        const [, setQueryParam] = useQueryParamString()
        expect(setQueryParam).toHaveBeenCalledWith(undefined)
      })
    })
  })
  describe("when the query string already has a keyword", () => {
    const keywordName = "Treefrog"

    beforeEach(() => {
      mockQueryParamSearchString = keywordName.toLowerCase()
      const products = render(<KeywordFilter filterer={filterer} keywords={keywords} />)
      rerender = () => products.rerender(<KeywordFilter filterer={filterer} keywords={keywords} />)
    })

    it("passes through the original keyword to the listener", () => {
      expect(filterer).toHaveBeenCalledWith([keywordName.toLowerCase()])
    })

    it("updates the ticky box icons", () => {
      expect(screen.getAllByTitle("unticked")).toHaveLength(
        keywords.length - 1
      )
      expect(screen.getByTitle("ticked")).toBeTruthy()
    })

    it("sets search parameters", async () => {

      const [, setQueryParam] = useQueryParamString()

      expect(setQueryParam).toHaveBeenCalledWith(keywordName.toLowerCase())
    })
  })
})

