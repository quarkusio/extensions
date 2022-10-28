import React from "react"
import { render, screen } from "@testing-library/react"
import CompatibilityFilter from "./compatibility-filter"

describe("compatibility filter", () => {
  beforeEach(() => {
    render(<CompatibilityFilter />)
  })

  xit("renders a title", () => {
    expect(screen.getByText("Compatibility")).toBeTruthy()
  })
})
