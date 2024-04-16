import React from "react"
import { render, screen } from "@testing-library/react"
import CategoryFilter from "./category-filter"
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

describe("category filter", () => {
  let user
  const filterer = jest.fn(() => {
    // cheat, since normally the parent will force a rerender, and the child does not use usestate to avoid infinite loops
    if (rerender) {
      try {
        rerender()
      } catch (e) {
        // This can happen if the component is already unmounted
      }
    }
  })
  const categories = ["toad", "tadpole", "treefrog"]

  describe("when the query string starts blank", () => {

    beforeEach(() => {
      user = userEvent.setup()
      mockQueryParamSearchString = undefined
      const products = render(<CategoryFilter filterer={filterer} categories={categories} />)
      rerender = () => {
        products.rerender(<CategoryFilter filterer={filterer} categories={categories} />)
      }
    })

    it("renders a categories title", () => {
      expect(screen.getByText("Category")).toBeTruthy()
    })

    it("renders prettified individual category names", () => {
      expect(screen.getByText("Toad")).toBeTruthy()
      expect(screen.getByText("Tadpole")).toBeTruthy()
    })

    it("renders tickboxes", () => {
      expect(screen.getAllByTitle("unticked")).toHaveLength(categories.length)
    })

    describe("when clicking a ticky box", () => {
      const categoryName = "Treefrog"
      beforeEach(async () => {
        await user.click(screen.getByText(categoryName))
      })

      it("passes through the original category name to the listener", () => {
        expect(filterer).toHaveBeenCalledWith([categoryName.toLowerCase()])
      })

      it("updates the ticky box icons", async () => {
        expect(screen.getByTitle("ticked")).toBeTruthy()
        expect(screen.getAllByTitle("unticked")).toHaveLength(
          categories.length - 1
        )
      })

      it("sets search parameters", async () => {

        const [, setQueryParam] = useQueryParamString()

        expect(setQueryParam).toHaveBeenCalledWith(categoryName.toLowerCase())
      })
    })

    describe("when clicking several ticky boxes", () => {
      const categoryName = "Treefrog"
      const otherName = "Toad"
      beforeEach(async () => {
        await user.click(screen.getByText(categoryName))
        await user.click(screen.getByText(otherName))
      })

      it("passes through the category names to the listener", () => {
        expect(filterer).toHaveBeenCalledWith([
          categoryName.toLowerCase(),
          otherName.toLowerCase(),
        ])
      })

      it("updates the ticky box icons", () => {
        expect(screen.getAllByTitle("unticked")).toHaveLength(
          categories.length - 2
        )
        expect(screen.getAllByTitle("ticked")).toHaveLength(2)
      })

      it("sets search parameters", async () => {

        const [, setQueryParam] = useQueryParamString()

        expect(setQueryParam).toHaveBeenCalledWith(categoryName.toLowerCase() + "," + otherName.toLowerCase())
      })
    })

    describe("when un-clicking a ticky box", () => {
      const categoryName = "Treefrog"
      beforeEach(async () => {
        await user.click(screen.getByText(categoryName))
        await user.click(screen.getByText(categoryName))
      })

      it("passes through the filter to the listener", () => {
        expect(filterer).toHaveBeenCalledWith([categoryName.toLowerCase()])
        expect(filterer).toHaveBeenCalledWith([])
      })

      it("updates the ticky box icons to go back to unticked", () => {
        expect(screen.queryAllByTitle("ticked")).toHaveLength(0)
        expect(screen.getAllByTitle("unticked")).toHaveLength(categories.length)
      })

      it("unsets search parameters", async () => {
        const [, setQueryParam] = useQueryParamString()
        expect(setQueryParam).toHaveBeenCalledWith(undefined)
      })
    })
  })
  describe("when the query string already has a category", () => {
    const categoryName = "Treefrog"

    beforeEach(() => {
      mockQueryParamSearchString = categoryName.toLowerCase()
      const products = render(<CategoryFilter filterer={filterer} categories={categories} />)
      rerender = () => products.rerender(<CategoryFilter filterer={filterer} categories={categories} />)
    })

    it("passes through the original category name to the listener", () => {
      expect(filterer).toHaveBeenCalledWith([categoryName.toLowerCase()])
    })

    it("updates the ticky box icons", () => {
      expect(screen.getAllByTitle("unticked")).toHaveLength(
        categories.length - 1
      )
      expect(screen.getByTitle("ticked")).toBeTruthy()
    })

    it("sets search parameters", async () => {

      const [, setQueryParam] = useQueryParamString()

      expect(setQueryParam).toHaveBeenCalledWith(categoryName.toLowerCase())
    })
  })
})

