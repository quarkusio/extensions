import React from "react"
import { render, screen } from "@testing-library/react"
import Navigation from "./navigation"

describe("navigation bar", () => {
  const title = "Quarkus"

  beforeEach(() => {
    render(<Navigation />)
  })

  it("renders the title", () => {
    expect(screen.getByText(title)).toBeTruthy()
  })

  xit("renders the correct link", () => {
    const link = screen.getByRole("link")
    expect(link).toBeTruthy()
    // Hardcoding the host is a bit risky but this should always be true in  test environment
    expect(link.href).toBe("http://localhost/quarkus")
  })

  xit("has some styling on it", () => {
    const element = screen.getByText(title)
    // This is a bit brittle, but we sometimes lose the styled-jsx styles on the item, and react testing library doesn't make it easy to test for a jsx-* class name
    expect(element).toHaveStyle(`font-size: ${theme.blog.h1.size}`)
  })
})
