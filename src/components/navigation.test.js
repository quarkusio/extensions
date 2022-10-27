import React from "react"
import { render, screen } from "@testing-library/react"
import Navigation from "./navigation"

describe("navigation bar", () => {
  const linkTitle = "Support"

  beforeEach(() => {
    render(<Navigation />)
  })

  it("renders a navigation link", () => {
    expect(screen.getByText(linkTitle)).toBeTruthy()
  })

  it("renders links", () => {
    const link = screen.getAllByRole("link")
    expect(link).toBeTruthy()
  })
})
