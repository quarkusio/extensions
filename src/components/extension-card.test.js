import React from "react"
import { render, screen } from "@testing-library/react"
import ExtensionCard from "./extension-card"

describe("extension card", () => {
  const category = "jewellery"
  const extension = {
    name: "JRuby",
    slug: "jruby-slug",
    metadata: { categories: [category] },
  }

  beforeEach(() => {
    render(<ExtensionCard extension={extension} />)
  })

  it("renders the extension name", () => {
    expect(screen.getByText(extension.name)).toBeTruthy()
  })

  it("renders the correct link", () => {
    const link = screen.getByRole("link")
    expect(link).toBeTruthy()
    // Hardcoding the host is a bit risky but this should always be true in  test environment
    expect(link.href).toBe("http://localhost/jruby-slug")
  })

  it("renders the category", () => {
    expect(screen.getByText("Category: " + category)).toBeTruthy()
  })
})
