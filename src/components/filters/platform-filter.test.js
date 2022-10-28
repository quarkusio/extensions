import React from "react"
import { render, screen } from "@testing-library/react"
import PlatformFilter from "./platform-filter"

describe("platform filter", () => {
  beforeEach(() => {
    render(<PlatformFilter />)
  })

  xit("renders platform title", () => {
    expect(screen.getByText("Platforms")).toBeTruthy()
  })
})
