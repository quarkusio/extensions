import React from "react"
import { render, screen } from "@testing-library/react"

describe("extension list", () => {
  const category = "jewellery"
  const extensions = [
    {
      name: "JRuby",
      slug: "jruby-slug",
      metadata: { categories: [category] },
    },
  ]

  beforeEach(() => {
    render(<ExtensionsList extensions={extensions} />)
  })

  it("renders the extension name", () => {
    expect(screen.getByText(extension[0].name)).toBeTruthy()
  })

  it("renders the correct link", () => {
    const link = screen.getByRole("link")
    expect(link).toBeTruthy()
    // Hardcoding the host is a bit risky but this should always be true in  test environment
    expect(link.href).toBe("http://localhost/jruby-slug")
  })
})
