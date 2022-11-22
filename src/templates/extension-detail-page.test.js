import React from "react"
import { render, screen } from "@testing-library/react"
import ExtensionDetailTemplate from "./extension-detail"

describe("extension detail page", () => {
  describe("for an extension with lots of information", () => {
    const category = "jewellery"
    const guideUrl = "http://quarkus.io/theguide"
    const platform1 = "A Box"
    const platform2 = "quarkus-bom-quarkus-platform-descriptor"
    const nonPlatform = "quarkus-non-platform-extensions"

    const previous = {}
    const next = {}

    const status = "primordial"
    const extension = {
      name: "JRuby",
      slug: "jruby-slug",
      metadata: {
        categories: [category],
        status: status,
        guide: guideUrl,
      },
      platforms: [platform1, platform2, nonPlatform],
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
      expect(screen.getAllByText(extension.name)).toHaveLength(2)
    })

    it("renders the category", () => {
      expect(screen.getByText(category)).toBeTruthy()
    })

    it("renders the status", () => {
      expect(screen.getByText(status)).toBeTruthy()
    })

    it("renders the platform title as plural", () => {
      expect(screen.getByText("Platforms")).toBeTruthy()
    })

    it("renders the platforms", () => {
      expect(screen.getByText(platform1)).toBeTruthy()
      // what gets shown should be the pretty-platform variant of the name
      expect(screen.getByText("Quarkus Platform")).toBeTruthy()
    })

    it("does not bother to list non-platform as a platform", () => {
      // Non-platform isn't a platform, so let's not include it in the list of platforms
      expect(screen.queryByText("Non Platform Extensions")).toBeFalsy()
    })

    it("renders a link to the guide", () => {
      const links = screen.getAllByRole("link")
      expect(links).toBeTruthy()
      const link = links.find(link => link.href === guideUrl)
      expect(link).toBeTruthy()
    })

    it("does not render an unlisted banner", async () => {
      const link = await screen.queryByText(/nlisted/)
      expect(link).toBeNull()
    })
  })

  describe("for an extension with only one platform", () => {
    const category = "jewellery"
    const guideUrl = "http://quarkus.io/theguide"
    const platform1 = "A Box"

    const previous = {}
    const next = {}

    const status = "primordial"
    const extension = {
      name: "JRuby",
      slug: "jruby-slug",
      metadata: {
        categories: [category],
        status: status,
        guide: guideUrl,
      },
      platforms: [platform1],
    }

    beforeEach(() => {
      render(
        <ExtensionDetailTemplate
          data={{ extension, previous, next }}
          location="/somewhere"
        />
      )
    })

    it("renders the platform title as singular", () => {
      expect(screen.getByText("Platform")).toBeTruthy()
    })

    it("renders the platform name", () => {
      expect(screen.getByText(platform1)).toBeTruthy()
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
      expect(screen.getAllByText(extension.name)).toHaveLength(2)
    })

    it("does not render anything about guides", async () => {
      const link = await screen.queryByText(/Documentation/)
      expect(link).toBeNull()
    })
  })

  describe("for an unlisted extension", () => {
    const previous = {}
    const next = {}

    const category = "secret-jewellery"
    const extension = {
      name: "Secret JRuby",
      slug: "jruby-slug",
      metadata: { categories: [category], unlisted: true },
    }

    beforeEach(() => {
      render(
        <ExtensionDetailTemplate
          data={{ extension, previous, next }}
          location="/somewhere"
        />
      )
    })

    it("renders an unlisted banner", () => {
      expect(screen.getByText("Unlisted")).toBeTruthy()
    })
  })
})
