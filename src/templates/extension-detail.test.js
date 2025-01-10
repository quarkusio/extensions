import React from "react"
import { render, screen, within } from "@testing-library/react"
import ExtensionDetailTemplate from "./extension-detail"
import userEvent from "@testing-library/user-event"
import { getQueryParams, useQueryParamString } from "react-use-query-param-string"


jest.mock("react-use-query-param-string", () => {
  const original = jest.requireActual("react-use-query-param-string") // Step 2.
  return {
    ...original,
    useQueryParamString: jest.fn(),
    getQueryParams: jest.fn()
  }
})

describe("extension detail page", () => {
  describe("for an extension with lots of information", () => {
    const category = "jewellery"
    const keyword = "Shiny"
    const guideUrl = "http://quarkus.io/theguide"
    const platform1 = "A Box"
    const platform2 = "quarkus-bom-quarkus-platform-descriptor"
    const nonPlatform = "quarkus-non-platform-extensions"
    const version = 0.42
    const groupId = "gr.something"
    const artifactId = "art.somethingelse"

    const mvnUrl = "http://yup.its.maven/"
    const javadocUrl = "http://ooh.its.javadoc/"
    const gitUrl = "https://github.com/someorg/someproject"
    const olderUrl = "old-slug"

    const previous = {}
    const next = {}

    const status = ["primordial"]

    const user = userEvent.setup()

    const extension = {
      name: "JRuby",
      slug: "jruby-slug",
      metadata: {
        categories: [category],
        keywords: [keyword],
        status: status,
        guide: guideUrl,
        builtWithQuarkusCore: "2.23.0",
        minimumJavaVersion: "5",
        maven: {
          version,
          groupId,
          artifactId,
          url: mvnUrl,
          timestamp: "1666716560000",
        },
        javadoc: {
          url: javadocUrl,
        },
        sourceControl: {
          repository: {
            url: gitUrl,
            project: "jproject",
          },
          issuesUrl: "https://github.com/someorg/someproject/issues",
          issues: 839,
          sponsors: ["Automatically Calculated Sponsor"],
          lastUpdated: "1698924315702",
          contributors: [{ name: "Alice", contributions: 6 }, { name: "Bob", contributions: 2 }],
          samplesUrl: [{ description: "samples", url: "https://github.com/someorg/someproject/main/blob/samples" }],
          ownerImage: {
            childImageSharp: {
              gatsbyImageData: "specific-logo.png",
            },
          },
        },
      },
      platforms: [platform1, platform2, nonPlatform],
      origins: [
        "org.quarkus.platform:" + platform1 + ":1",
        "org.quarkus.platform:" + platform2 + ":1",
        "org.quarkus.registry:" + nonPlatform + ":1",
      ],
      duplicates: [
        {
          slug: olderUrl,
          relationship: "older",
          groupId: "old-group-id",
          differenceReason: "group id",
          differentId: "old-group-id"
        },
      ],
    }

    const setSearchString = jest.fn()
    beforeEach(() => {

      useQueryParamString.mockReturnValue([undefined, setSearchString])

      render(
        <ExtensionDetailTemplate
          data={{ extension, previous, next }}
          location="/somewhere"
        />
      )
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it("renders the extension name", () => {
      expect(screen.getAllByText(extension.name)).toHaveLength(2)
    })

    it("renders the category", () => {
      expect(screen.getByText(category)).toBeTruthy()
    })

    it("renders the category as a link", () => {
      expect(screen.getByText(category).href).toBe(
        "http://localhost/?categories=" + category)
    })

    it("renders the keywords, with a hash prefix", () => {
      expect(screen.getByText("#" + keyword)).toBeTruthy()
    })

    it("renders the keywords as a link", () => {
      expect(screen.getByText("#" + keyword).href).toBe(
        "http://localhost/?keywords=" + keyword.toLowerCase())
    })

    it("renders the artifact id", () => {
      expect(screen.getByText(artifactId)).toBeInTheDocument()
    })

    it("renders the group id", () => {
      expect(screen.getByText(groupId)).toBeInTheDocument()
    })

    it("renders the status", () => {
      expect(screen.getByText(status[0])).toBeTruthy()
    })

    it("renders the version", () => {
      expect(screen.getByText(version)).toBeTruthy()
    })

    it("renders the release date", () => {
      const publishDate = "Last Released"
      expect(screen.getByText(publishDate)).toBeTruthy()
      const dateSection = screen.getByText(publishDate).closest("section")

      expect(within(dateSection).getByText("Oct 25, 2022")).toBeTruthy()
    })

    it("renders the platform title as plural", () => {
      expect(screen.getByText("Platforms")).toBeTruthy()
    })

    it("renders what version of quarkus the extension was built with", () => {
      expect(screen.getByText("Built with")).toBeTruthy()
    })

    it("renders the minimum java version", () => {
      expect(screen.getByText("Minimum Java version")).toBeTruthy()
    })

    it("renders the platforms", () => {
      // what gets shown should be the qualified-platform variant of the name
      expect(screen.getByText("org.quarkus.platform:" + platform1)).toBeTruthy()
    })

    it("does not bother to list non-platform as a platform", () => {
      // Non-platform isn't a platform, so let's not include it in the list of platforms
      expect(screen.queryByText("Non Platform Extensions")).toBeFalsy()
      expect(screen.queryByText("Other")).toBeFalsy()
    })

    it("renders a link to the guide", () => {
      const links = screen.getAllByRole("link")
      expect(links).toBeTruthy()
      const link = links.find(link => link.href === guideUrl)
      expect(link).toBeTruthy()
    })

    it("renders a link to maven central", () => {
      expect(screen.getByText("Repository")).toBeTruthy()
      expect(screen.getByText("Maven Central")).toBeTruthy()
      expect(screen.getByText("Maven Central").href).toBe(mvnUrl)
    })

    it("renders a link to the javadoc", () => {
      expect(screen.getByText("Javadoc")).toBeTruthy()
      expect(screen.getByText("javadoc.io").href).toBe(javadocUrl)
    })

    it("renders a link to source control", () => {
      expect(screen.getByText("Source code")).toBeTruthy()
      expect(screen.getByText("jproject")).toBeTruthy()

      const links = screen.getAllByRole("link")
      expect(links).toBeTruthy()
      const link = links.find(link => link.href === gitUrl)
      expect(link).toBeTruthy()
    })

    it("renders a link to samples", () => {
      expect(screen.getByText("Samples")).toBeTruthy()

      const links = screen.getAllByRole("link")
      expect(links).toBeTruthy()
      const link = links.find(link => link.href === "https://github.com/someorg/someproject/main/blob/samples")
      expect(link).toBeTruthy()
    })


    it("renders a link to an issue count", () => {
      expect(screen.getByText("Issues")).toBeTruthy()
      expect(screen.getByText("839")).toBeTruthy()
      expect(screen.getByText("839").href).toBe(
        "https://github.com/someorg/someproject/issues"
      )
    })

    it("renders a sponsor field", () => {
      expect(screen.getByText("Sponsor")).toBeTruthy()
      expect(screen.getByText("Automatically Calculated Sponsor")).toBeTruthy()
    })

    it("renders a message about duplicate extensions", () => {
      expect(screen.getByText(/older version/)).toBeTruthy()
      expect(screen.getByText(/old-group-id/)).toBeTruthy()

      const links = screen.getAllByRole("link")
      expect(links).toBeTruthy()
      const link = links.find(link => link.href.includes(olderUrl))
      expect(link).toBeTruthy()
    })

    it("renders an icon with appropriate source", async () => {
      const image = screen.getByAltText("The icon of the organisation")

      // We can't just read the source, because this is a gatsby container, not a raw image
      // The key names in the objects have UUIDs in them, so we cannot trivially inspect the object
      // We could stringify and look for the image name, but that's a lot like hard work
      expect(image).toBeTruthy()
    })

    it("renders a contributors tab", async () => {
      expect(screen.getAllByText("Community")).toHaveLength(2)
      // One for the menu, one for the tab
    })

    it("has contributors information on the community tab", async () => {
      expect(screen.queryByText("Recent Contributors")).toBeFalsy()
      const tab = screen.getAllByText("Community")[1] // get the last element, which should be second
      await user.click(tab)
      expect(screen.getByText("Recent Contributors")).toBeTruthy()
    })

    it("has last updated information on the community tab", async () => {
      const tab = screen.getAllByText("Community")[1] // get the last element, which should be second
      await user.click(tab)
      const year = "2023"
      const lastUpdated = screen.getByText(/last updated/i)
      expect(lastUpdated).toBeTruthy()

      expect(lastUpdated.innerHTML).toMatch(" " + year)

    })

    // With the resizable container, we can't see inside the chart at all, sadly
    it.skip("renders a committers chart", async () => {
      // The committers chart is an svg, not an image, but we can find it by title
      const chartTitle = screen.getByTitle("Committers")

      // ... but there's not much we can meaningfully test
      const chart = chartTitle.closest("svg")
      expect(chart).toBeTruthy()
    })

    it("sets a url parameter on the Community tab", async () => {
      const tab = screen.getAllByText("Community")[1] // get the last element, which should be second
      await user.click(tab)
      expect(setSearchString).toHaveBeenCalled()
      expect(setSearchString).toHaveBeenCalledWith("community")

    })

    it("sets a url parameter when clicking back to the first tab", async () => {
      const tab = screen.getAllByText("Community")[1] // get the last element, which should be second
      await user.click(tab)

      const tab2 = screen.getAllByText("Documentation")[0] // This should be the first element with this name
      await user.click(tab2)
      expect(setSearchString).toHaveBeenCalled()
      expect(setSearchString).toHaveBeenLastCalledWith("docs")
    })


    it("does not render an unlisted banner", async () => {
      const link = await screen.queryByText(/nlisted/)
      expect(link).toBeNull()
    })

    describe("when url parameters are set on initial load", () => {
      beforeEach(() => {

        // we do *not* mock useQueryParamString to return a useful value, because in the actual app it does not return a value on initial load
        getQueryParams.mockReturnValue({ tab: "community" })

        render(
          <ExtensionDetailTemplate
            data={{ extension, previous, next }}
            location="/somewhere"
          />
        )
      })

      it("honours the url parameter", async () => {
        expect(screen.getByText("Recent Contributors")).toBeTruthy()
      })

      it("adjusts a url parameter when clicking back to the first tab", async () => {
        const tab = screen.getAllByText("Documentation")[0]
        await user.click(tab)
        expect(setSearchString).toHaveBeenCalled()
        expect(setSearchString).toHaveBeenLastCalledWith("docs")
        // The original tab will still be in the dom, but the docs tab should now be rendered
        expect(screen.queryByText(/Installation/)).toBeTruthy()

        const tab2 = screen.getAllByText("Community")[1]
        await user.click(tab2)
        expect(setSearchString).toHaveBeenCalled()
        expect(setSearchString).toHaveBeenLastCalledWith("community")
        expect(screen.getAllByText("Recent Contributors")).toBeTruthy()
      })
    })
  })

  describe("for an extension with a manual sponsor override", () => {
    const gitUrl = "https://github.com/someorg/someproject"

    const previous = {}
    const next = {}

    const extension = {
      name: "JRuby",
      slug: "jruby-slug",
      metadata: {
        sponsors: ["Manual Sponsor Override"],
        sourceControl: {
          repository: {
            url: gitUrl,
            project: "jproject",
          },
          issuesUrl: "https://github.com/someorg/someproject/issues",
          issues: 839,
          sponsors: ["Automatically Calculated Sponsor"],
          ownerImage: {
            childImageSharp: {
              gatsbyImageData: "specific-logo.png",
            },
          },
        },
      }
    }

    beforeEach(() => {
      render(
        <ExtensionDetailTemplate
          data={{ extension, previous, next }}
          location="/somewhere"
        />
      )
    })

    it("renders a sponsor field, using the information manually set", () => {
      expect(screen.getByText("Sponsor")).toBeTruthy()
      expect(screen.getByText("Manual Sponsor Override")).toBeTruthy()
      expect(screen.queryByText("Automatically Calculated Sponsor")).toBeFalsy()
    })
  })

  // People are likely to get the type of the Sponsors field wrong, so we should be tolerant
  describe("for an extension with a manual sponsor override which is not an array", () => {
    const gitUrl = "https://github.com/someorg/someproject"

    const previous = {}
    const next = {}

    const extension = {
      name: "JRuby",
      slug: "jruby-slug",
      metadata: {
        sponsors: "Manual Sponsor Override",
        sourceControl: {
          repository: {
            url: gitUrl, project: "jproject",
          },
          issuesUrl: "https://github.com/someorg/someproject/issues",
          issues: 839,
          sponsors: ["Automatically Calculated Sponsor"],
          ownerImage: {
            childImageSharp: {
              gatsbyImageData: "specific-logo.png",
            },
          },
        },
      }
    }

    beforeEach(() => {
      render(
        <ExtensionDetailTemplate
          data={{ extension, previous, next }}
          location="/somewhere"
        />
      )
    })

    it("renders a sponsor field, using the information manually set", () => {
      expect(screen.getByText("Sponsor")).toBeTruthy()
      expect(screen.queryByText("Automatically Calculated Sponsor")).toBeFalsy()
      expect(screen.getByText("Manual Sponsor Override")).toBeTruthy()
    })
  })

  // People are likely to get the name of the Sponsors field wrong, so we should be tolerant
  describe("for an extension with a manual sponsor override which uses the non-plural name", () => {
    const gitUrl = "https://github.com/someorg/someproject"

    const previous = {}
    const next = {}

    const extension = {
      name: "JRuby",
      slug: "jruby-slug",
      metadata: {
        sponsor: "Manual Sponsor Override",
        sourceControl: {
          repository: {
            url: gitUrl,
            project: "jproject",
          },
          issuesUrl: "https://github.com/someorg/someproject/issues",
          issues: 839,
          sponsors: ["Automatically Calculated Sponsor"],
          ownerImage: {
            childImageSharp: {
              gatsbyImageData: "specific-logo.png",
            },
          },
        },
      }
    }

    beforeEach(() => {
      render(
        <ExtensionDetailTemplate
          data={{ extension, previous, next }}
          location="/somewhere"
        />
      )
    })

    it("renders a sponsor field, using the information manually set", () => {
      expect(screen.getByText("Sponsor")).toBeTruthy()
      expect(screen.getByText("Manual Sponsor Override")).toBeTruthy()
      expect(screen.queryByText("Automatically Calculated Sponsor")).toBeFalsy()
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
      origins: ["org.quarkus.platform:" + platform1 + ":1"],
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
      expect(screen.getByText("org.quarkus.platform:" + platform1)).toBeTruthy()
    })
  })

  // When we return a source control block with nulls, we should not display a source control section
  describe("for an extension with missing source control information", () => {
    const previous = {}
    const next = {}

    const extension = {
      name: "JRuby",
      slug: "jruby-slug",
      metadata: { "sourceControl": null },
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

    it("does not render anything about source control", async () => {
      expect(screen.queryByText(/Source code/)).toBeFalsy()
    })

    it("does not render anything about source", async () => {
      expect(screen.queryByText(/source/)).toBeFalsy()
    })

    it("does not render a contributors tab", async () => {
      expect(screen.getAllByText("Community")).toHaveLength(1)
      // One for the menu, none for the tab
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
      const link = await screen.queryByText(/Guides/)
      expect(link).toBeNull()
    })

    it("does not render anything about samples", async () => {
      const link = await screen.queryByText(/Sample/)
      expect(link).toBeNull()
    })

    it("does not render a link to the javadoc", () => {
      expect(screen.queryByText("Javadoc")).toBeFalsy()
    })

    it("does not render fields for which there is no information", async () => {
      let link = await screen.queryByText("Platform")
      expect(link).toBeNull()

      link = await screen.queryByText("Category")
      expect(link).toBeNull()

      link = await screen.queryByText("Version")
      expect(link).toBeNull()

      link = await screen.queryByText("Latest Version")
      expect(link).toBeNull()

      link = await screen.queryByText("Issues")
      expect(link).toBeNull()

      link = await screen.queryByText("Sponsor")
      expect(link).toBeNull()
    })

    it("renders a placeholder image with appropriate source", async () => {
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

  // A date of '0' is invalid and should not be displayed
  describe("for an extension whose date is zero", () => {
    const previous = {}
    const next = {}

    const category = "old-jewellery"
    const extension = {
      name: "Ancient JRuby",
      slug: "jruby-slug",
      metadata: {
        categories: [category], maven: { timestamp: "0" },
      },
    }

    beforeEach(() => {
      render(
        <ExtensionDetailTemplate
          data={{ extension, previous, next }}
          location="/somewhere"
        />
      )
    })

    it("does not render a release date", () => {
      const publishDate = "Last Released"
      expect(screen.queryByText(publishDate)).toBeFalsy()
    })
  })
})
