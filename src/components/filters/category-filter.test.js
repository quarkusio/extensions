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
    const categoryName = "treefrog"
    beforeEach(() => {
      fireEvent.click(screen.getByText(categoryName))
    })

    it("passes through the search expression to the listener", () => {
      expect(filterer).toHaveBeenCalledWith([categoryName])
    })

    it("updates the ticky box icons", () => {
      expect(screen.getAllByTitle("unticked")).toHaveLength(
        categories.length - 1
      )
      expect(screen.getByTitle("ticked")).toBeTruthy()
    })
  })

  describe("when clicking several ticky box", () => {
    const categoryName = "treefrog"
    const otherName = "toad"
    beforeEach(() => {
      fireEvent.click(screen.getByText(categoryName))
      fireEvent.click(screen.getByText(otherName))
    })

    it("passes through the search expression to the listener", () => {
      expect(filterer).toHaveBeenCalledWith([categoryName, otherName])
    })

    it("updates the ticky box icons", () => {
      expect(screen.getAllByTitle("unticked")).toHaveLength(
        categories.length - 2
      )
      expect(screen.getAllByTitle("ticked")).toHaveLength(2)
    })
  })

  describe("when un-clicking a ticky box", () => {
    const categoryName = "treefrog"
    beforeEach(() => {
      fireEvent.click(screen.getByText(categoryName))
      fireEvent.click(screen.getByText(categoryName))
    })

    it("passes through the search expression to the listener", () => {
      expect(filterer).toHaveBeenCalledWith([categoryName])
      expect(filterer).toHaveBeenCalledWith([])
    })

    it("updates the ticky box icons to go back to unticked", () => {
      expect(screen.getAllByTitle("unticked")).toHaveLength(categories.length)
      expect(screen.queryAllByTitle("ticked")).toHaveLength(0)
    })
  })
})
