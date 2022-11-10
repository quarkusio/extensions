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

  it("renders prettified individual category names", () => {
    expect(screen.getByText("Toad")).toBeTruthy()
    expect(screen.getByText("Tadpole")).toBeTruthy()
  })

  it("renders tickboxes", () => {
    expect(screen.getAllByTitle("unticked")).toHaveLength(categories.length)
  })

  describe("when clicking a ticky box", () => {
    const categoryName = "Treefrog"
    beforeEach(() => {
      fireEvent.click(screen.getByText(categoryName))
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
  })

  describe("when clicking several ticky box", () => {
    const categoryName = "Treefrog"
    const otherName = "Toad"
    beforeEach(() => {
      fireEvent.click(screen.getByText(categoryName))
      fireEvent.click(screen.getByText(otherName))
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
  })

  describe("when un-clicking a ticky box", () => {
    const categoryName = "Treefrog"
    beforeEach(() => {
      fireEvent.click(screen.getByText(categoryName))
      fireEvent.click(screen.getByText(categoryName))
    })

    it("passes through the filter to the listener", () => {
      expect(filterer).toHaveBeenCalledWith([categoryName.toLowerCase()])
      expect(filterer).toHaveBeenCalledWith([])
    })

    it("updates the ticky box icons to go back to unticked", () => {
      expect(screen.getAllByTitle("unticked")).toHaveLength(categories.length)
      expect(screen.queryAllByTitle("ticked")).toHaveLength(0)
    })
  })
})
