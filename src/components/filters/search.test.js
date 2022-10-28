import React from "react"
import { render, screen } from "@testing-library/react"

describe("search", () => {
  beforeEach(() => {
    render(<Search />)
  })

  xit("renders a search form", () => {
    expect(screen.getByText("Categories")).toBeTruthy()
  })
})
