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
  const categories = [
    { categoryId: "toad", name: "Toad", description: "Toad-related extensions" },
    { categoryId: "tadpole", name: "Tadpole", description: "Tadpole utilities" },
    { categoryId: "treefrog", name: "Tree frog", description: "Tree frog frameworks" }
  ]

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

    it("renders official category names", () => {
      expect(screen.getByText("Toad")).toBeTruthy()
      expect(screen.getByText("Tadpole")).toBeTruthy()
      expect(screen.getByText("Tree frog")).toBeTruthy()
    })

    it("renders tickboxes", () => {
      expect(screen.getAllByTitle("unticked")).toHaveLength(categories.length)
    })

    describe("when clicking a ticky box", () => {
      const categoryName = "Tree frog"
      const categoryId = "treefrog"
      beforeEach(async () => {
        await user.click(screen.getByText(categoryName))
      })

      it("passes through the category ID to the listener", () => {
        expect(filterer).toHaveBeenCalledWith([categoryId])
      })

      it("updates the ticky box icons", async () => {
        expect(screen.getByTitle("ticked")).toBeTruthy()
        expect(screen.getAllByTitle("unticked")).toHaveLength(
          categories.length - 1
        )
      })

      it("sets search parameters", async () => {

        const [, setQueryParam] = useQueryParamString()

        expect(setQueryParam).toHaveBeenCalledWith(categoryId)
      })
    })

    describe("when clicking several ticky boxes", () => {
      const categoryName = "Tree frog"
      const categoryId = "treefrog"
      const otherName = "Toad"
      const otherId = "toad"
      beforeEach(async () => {
        await user.click(screen.getByText(categoryName))
        await user.click(screen.getByText(otherName))
      })

      it("passes through the category IDs to the listener", () => {
        expect(filterer).toHaveBeenCalledWith([
          categoryId,
          otherId,
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

        expect(setQueryParam).toHaveBeenCalledWith(categoryId + "," + otherId)
      })
    })

    describe("when un-clicking a ticky box", () => {
      const categoryName = "Tree frog"
      const categoryId = "treefrog"
      beforeEach(async () => {
        await user.click(screen.getByText(categoryName))
        await user.click(screen.getByText(categoryName))
      })

      it("passes through the filter to the listener", () => {
        expect(filterer).toHaveBeenCalledWith([categoryId])
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
    const categoryName = "Tree frog"
    const categoryId = "treefrog"

    beforeEach(() => {
      mockQueryParamSearchString = categoryId
      const products = render(<CategoryFilter filterer={filterer} categories={categories} />)
      rerender = () => products.rerender(<CategoryFilter filterer={filterer} categories={categories} />)
    })

    it("passes through the category ID to the listener", () => {
      expect(filterer).toHaveBeenCalledWith([categoryId])
    })

    it("updates the ticky box icons", () => {
      expect(screen.getAllByTitle("unticked")).toHaveLength(
        categories.length - 1
      )
      expect(screen.getByTitle("ticked")).toBeTruthy()
    })

    it("sets search parameters", async () => {

      const [, setQueryParam] = useQueryParamString()

      expect(setQueryParam).toHaveBeenCalledWith(categoryId)
    })
  })

  describe("when a category is not in the official list", () => {
    const unofficialCategories = [
      { categoryId: "toad", name: "Toad" },
      { categoryId: "custom-category", name: "Custom Category" }  // Prettified by gatsby-node
    ]

    beforeEach(() => {
      mockQueryParamSearchString = undefined
      render(<CategoryFilter filterer={filterer} categories={unofficialCategories} />)
    })

    it("displays the prettified category name from the Category node", () => {
      expect(screen.getByText("Custom Category")).toBeTruthy()
    })

    it("uses official names when available", () => {
      expect(screen.getByText("Toad")).toBeTruthy()
    })
  })
})

