import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import Search from "./search"

describe("search", () => {
  const searcher = jest.fn(() => {})
  beforeEach(() => {
    render(<Search searcher={searcher} />)
  })

  it("renders a search form", () => {
    expect(screen.getByPlaceholderText("Find an extension")).toBeTruthy()
  })

  it("passes through the search expression to the listener", () => {
    const searchInput = screen.getByPlaceholderText("Find an extension")

    fireEvent.change(searchInput, { target: { value: "test" } })

    expect(searcher).toHaveBeenCalledWith("test")
    expect(searchInput.value).toBe("test")
  })
})
