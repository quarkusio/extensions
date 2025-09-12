import React from "react"
import { render, screen } from "@testing-library/react"
import ExtensionCard from "./extension-card"

describe("extension card", () => {
  describe("a normal extension", () => {
    const category = "jewellery"
    const version = "1.2.3"

    const extension = {
      name: "JRuby",
      slug: "jruby-slug",
      metadata: {
        categories: [category],
        maven: {
          version,
          timestamp: "1666716560000",
        },
      },
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

    it("renders the version", () => {
      expect(screen.getByText("Latest version: " + version)).toBeTruthy()
    })

    it("renders the Last released", () => {
      expect(screen.getByText("Last released: Oct 25, 2022")).toBeTruthy()
    })

    it("renders a placeholder image with appropriate source", async () => {
      const image = screen.getByAltText(
        "A generic image as a placeholder for the extension icon"
      )

      expect(image.src).toContain("generic-extension-logo.png")
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

    it("adds an 'unlisted' label", () => {
      expect(screen.getByText(/unlisted/i)).toBeTruthy()
    })
  })

  describe("a superseded extension", () => {
    const category = "jewellery"
    const extension = {
      name: "JRuby",
      slug: "jruby-slug",
      isSuperseded: true,
      metadata: { categories: [category] },
    }

    beforeEach(() => {
      render(<ExtensionCard extension={extension} />)
    })

    // This is a weak test, because css variables don't turn up in the computed style, so we can't make assertions about the style
    // leaving this here just to check nothing breaks
    it("renders the extension name", () => {
      expect(screen.getByText(extension.name)).toBeTruthy()
    })

    it("adds a 'relocated' label", () => {
      expect(screen.getByText(/relocated/i)).toBeTruthy()
    })
  })

})
