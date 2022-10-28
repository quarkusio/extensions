import React from "react"
import { render, screen } from "@testing-library/react"
import Search from "./search"

describe("search", () => {
  beforeEach(() => {
    render(<Search />)
  })

  it("renders a search form", () => {
    expect(screen.getByPlaceholderText("Find an extension")).toBeTruthy()
  })
})
