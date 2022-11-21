import React from "react"
import { render, screen } from "@testing-library/react"
import ExtensionCard from "./extension-card"

describe("extension card", () => {
  describe("a normal extension", () => {
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

    it("renders the formatted category", () => {
      expect(screen.getByText("Category: Jewellery")).toBeTruthy()
    })
  })

  describe("an unlisted extension", () => {
    const category = "jewellery"
    const extension = {
      name: "JRuby",
      slug: "jruby-slug",
      metadata: { categories: [category], unlisted: true },
    }

    beforeEach(() => {
      render(<ExtensionCard extension={extension} />)
    })

    // This is a weak test, because css variables don't turn up in the computed style, so we can't make assertions about the style
    // leaving this here just to check nothing breaks
    it("renders the extension name", () => {
      expect(screen.getByText(extension.name)).toBeTruthy()
    })
  })
})
