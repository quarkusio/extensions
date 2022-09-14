import React from "react"
import { render, screen } from "@testing-library/react"
import ExtensionDetailTemplate from "./extension-detail"

describe("extension detail page", () => {
  describe("for an extension with lots of information", () => {
    const category = "jewellery"
    const guideUrl = "http://quarkus.io/theguide"
    const previous = {}
    const next = {}

    const extension = {
      name: "JRuby",
      slug: "jruby-slug",
      metadata: { categories: [category], guide: guideUrl },
    }

    beforeEach(() => {
      render(
        <ExtensionDetailTemplate
          data={{ extension, previous, next }}
          location="/somewhere"
        />
      )
    })

    it("renders the extension name", () => {
      expect(screen.getByText(extension.name)).toBeTruthy()
    })

    it("renders the category", () => {
      expect(screen.getByText(category)).toBeTruthy()
    })

    it("renders a link to the guide", () => {
      const links = screen.getAllByRole("link")
      expect(links).toBeTruthy()
      const link = links.find(link => link.href === guideUrl)
      expect(link).toBeTruthy()
    })
  })

  describe("for an extension with very little information", () => {
    const previous = {}
    const next = {}

    const extension = {
      name: "JRuby",
      slug: "jruby-slug",
      metadata: {},
    }

    beforeEach(() => {
      render(
        <ExtensionDetailTemplate
          data={{ extension, previous, next }}
          location="/somewhere"
        />
      )
    })

    it("renders the extension name", () => {
      expect(screen.getByText(extension.name)).toBeTruthy()
    })

    it("does not render anything about guides", async () => {
      const link = await screen.queryByText(/Documentation/)
      expect(link).toBeNull()
    })
  })
})
