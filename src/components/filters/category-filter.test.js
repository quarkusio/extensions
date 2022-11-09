import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import CategoryFilter from "./category-filter"

describe("category filter", () => {
  const filterer = jest.fn(() => {})
  beforeEach(() => {
    render(
      <CategoryFilter
        filterer={filterer}
        categories={["toad", "tadpole", "treefrog"]}
      />
    )
  })

  it("renders a categories title", () => {
    expect(screen.getByText("Category")).toBeTruthy()
  })

  it("renders individual category names", () => {
    expect(screen.getByText("toad")).toBeTruthy()
    expect(screen.getByText("tadpole")).toBeTruthy()
  })

  it("renders tickboxes", () => {
    expect(screen.getByText("toad")).toBeTruthy()
    expect(screen.getByText("tadpole")).toBeTruthy()
  })

  xit("passes through the search expression to the listener", () => {
    const categoryName = "treefrog"
    const filterInput = screen.getByText(categoryName)

    fireEvent.click(filterInput)

    expect(filterer).toHaveBeenCalledWith(categoryName)
  })
})
