import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import CategoryFilter from "./category-filter"

describe("category filter", () => {
  const filterer = jest.fn(() => {})
  const categories = ["toad", "tadpole", "treefrog"]

  beforeEach(() => {
    render(<CategoryFilter filterer={filterer} categories={categories} />)
  })

  it("renders a categories title", () => {
    expect(screen.getByText("Category")).toBeTruthy()
  })

  it("renders individual category names", () => {
    expect(screen.getByText("toad")).toBeTruthy()
    expect(screen.getByText("tadpole")).toBeTruthy()
  })

  it("renders tickboxes", () => {
    expect(screen.getAllByTitle("unticked")).toHaveLength(categories.length)
  })

  describe("when clicking a ticky box", () => {
    it("passes through the search expression to the listener", () => {
      const categoryName = "treefrog"
      const filterInput = screen.getByText(categoryName)

      fireEvent.click(filterInput)

      expect(filterer).toHaveBeenCalledWith([categoryName])
    })

    it("updates the ticky box icons", () => {
      const categoryName = "treefrog"
      const filterInput = screen.getByText(categoryName)

      fireEvent.click(filterInput)

      expect(screen.getAllByTitle("unticked")).toHaveLength(
        categories.length - 1
      )
      expect(screen.getByTitle("ticked")).toBeTruthy()
    })
  })
})
