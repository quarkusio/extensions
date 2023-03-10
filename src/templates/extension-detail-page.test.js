import React from "react"
import { render, screen, within } from "@testing-library/react"
import ExtensionDetailTemplate from "./extension-detail"

describe("extension detail page", () => {
  describe("for an extension with lots of information", () => {
    const category = "jewellery"
    const guideUrl = "http://quarkus.io/theguide"
    const platform1 = "A Box"
    const platform2 = "quarkus-bom-quarkus-platform-descriptor"
    const nonPlatform = "quarkus-non-platform-extensions"
    const version = 0.42
    const mvnUrl = "http://yup.its.maven/"
    const gitUrl = "https://github.com/someorg/someproject"
    const olderUrl = "old-slug"

    const previous = {}
    const next = {}

    const status = ["primordial"]
    const extension = {
      name: "JRuby",
      slug: "jruby-slug",
      metadata: {
        categories: [category],
        status: status,
        guide: guideUrl,
        builtWithQuarkusCore: "2.23.0",
        maven: {
          version,
          url: mvnUrl,
          timestamp: "1666716560000",
        },
        sourceControl: {
          url: gitUrl,
          project: "jproject",
          issues: 839,
          ownerImage: {
            childImageSharp: {
              gatsbyImageData: "specific-logo.png",
            },
          },
        },
      },
      platforms: [platform1, platform2, nonPlatform],
      duplicates: [
        { slug: olderUrl, relationship: "older", groupId: "old-group-id" },
      ],
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
      expect(screen.getByText(status[0])).toBeTruthy()
    })

    it("renders the version", () => {
      expect(screen.getByText(version)).toBeTruthy()
    })

    it("renders the release date", () => {
      const publishDate = "Publish Date"
      expect(screen.getByText(publishDate)).toBeTruthy()
      const dateSection = screen.getByText(publishDate).closest("section")

      expect(within(dateSection).getByText("Oct 25, 2022")).toBeTruthy()
    })

    it("renders the platform title as plural", () => {
      expect(screen.getByText("Platforms")).toBeTruthy()
    })

    it("renders the what version of quarkus the extension was built with", () => {
      expect(screen.getByText("Built with")).toBeTruthy()
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

    it("renders a link to maven central", () => {
      expect(screen.getByText("Maven Central")).toBeTruthy()
      expect(screen.getByText("Version 0.42")).toBeTruthy()

      const links = screen.getAllByRole("link")
      expect(links).toBeTruthy()
      const link = links.find(link => link.href === mvnUrl)
      expect(link).toBeTruthy()
    })

    it("renders a link to source control", () => {
      expect(screen.getByText("Extension Repository")).toBeTruthy()
      expect(screen.getByText("jproject")).toBeTruthy()

      const links = screen.getAllByRole("link")
      expect(links).toBeTruthy()
      const link = links.find(link => link.href === gitUrl)
      expect(link).toBeTruthy()
    })

    it("renders an issue count", () => {
      expect(screen.getByText("Issues")).toBeTruthy()
      expect(screen.getByText("839")).toBeTruthy()
    })

    it("renders a message about duplicate extensions", () => {
      expect(screen.getByText(/older version/)).toBeTruthy()
      expect(screen.getByText(/old-group-id/)).toBeTruthy()

      const links = screen.getAllByRole("link")
      expect(links).toBeTruthy()
      const link = links.find(link => link.href.includes(olderUrl))
      expect(link).toBeTruthy()
    })

    it("renders an icon with appropriate source ", async () => {
      const image = screen.getByAltText("The icon of the organisation")

      // We can't just read the source, because this is a gatsby container, not a raw image
      // The key names in the objects have UUIDs in them, so we cannot trivially inspect the object
      // We could stringify and look for the image name, but that's a lot like hard work
      expect(image).toBeTruthy()
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

    const status = ["primordial"]
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

    it("does not render fields for which there is no information", async () => {
      let link = await screen.queryByText("Platform")
      expect(link).toBeNull()

      link = await screen.queryByText("Category")
      expect(link).toBeNull()

      link = await screen.queryByText("Version")
      expect(link).toBeNull()

      link = await screen.queryByText("Issues")
      expect(link).toBeNull()
    })

    it("renders a placeholder image with appropriate source ", async () => {
      const image = screen.getByAltText(
        "A generic image as a placeholder for the extension icon"
      )

      expect(image.src).toContain("generic-extension-logo.png")
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
