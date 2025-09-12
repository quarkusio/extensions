import React from "react"
import { render, screen } from "@testing-library/react"
import ExtensionsAddedListTemplate from "./extensions-added-list"


jest.mock("react-use-query-param-string", () => {
  const original = jest.requireActual("react-use-query-param-string")
  return {
    ...original,
    useQueryParamString: jest.fn().mockReturnValue([]),
    getQueryParams: jest.fn()
  }
})

describe("extensions added page", () => {

  describe("when there are are extensions in that time period", () => {

    const category = "jewellery"
    const otherCategory = "snails"

    const ruby = {
      name: "JRuby",
      id: "jruby",
      sortableName: "ruby",
      slug: "jruby-slug",
      metadata: { categories: [category], },
      platforms: ["bottom of the garden"],
    }
    const diamond = {
      name: "JDiamond",
      id: "jdiamond",
      sortableName: "diamond",
      slug: "jdiamond-slug",
      metadata: { categories: [category] },
      platforms: ["a mine"],
    }

    const molluscs = {
      name: "Molluscs",
      id: "molluscs",
      sortableName: "mollusc",
      slug: "molluscs-slug",
      metadata: { categories: [otherCategory] },
      platforms: ["bottom of the garden"],
    }

    const obsolete = {
      name: "Obsolete",
      id: "really-old",
      sortableName: "old",
      slug: "old-slug",
      metadata: { categories: [otherCategory] },
      platforms: ["bottom of the garden"],
      duplicates: [{ relationship: "newer", groupId: "whatever" }],
      isSuperseded: true,
    }

    const maybeObsolete = {
      name: "Maybebsolete",
      id: "maybe-old",
      artifact: "maybe-old-or-not",
      sortableName: "maybe-old",
      slug: "ambiguous-slug",
      metadata: { categories: [otherCategory] },
      platforms: ["bottom of the garden"],
      duplicates: [{ relationship: "different", groupId: "whatever" }],
    }

    const extensions = [ruby, diamond, molluscs, obsolete, maybeObsolete]
    const graphQledExtensions = extensions.map(e => {
      e.metadata = { maven: { sinceMonth: "1585720800000" } }
      return {
        node: e
      }
    })

    beforeEach(async () => {
      render(<ExtensionsAddedListTemplate data={{
        allExtension: { edges: graphQledExtensions }
      }}
                                          pageContext={{
                                            nextMonthTimestamp: "12",
                                            previousMonthTimestamp: "487592268000",
                                            sinceMonth: "1585720800000"
                                          }}
                                          location={"extensions-added-some-date"} />)
    })

    it("renders the extension name", () => {
      expect(screen.getByText(extensions[0].name)).toBeTruthy()
    })

    it("renders the correct link", () => {
      const links = screen.getAllByRole("link")
      const link = links[links.length - 6]// Look at the last one that's not in the footer, because the top of the page will have a menu and the bottom will have footers - this is also testing the sorting
      expect(link).toBeTruthy()
      // Hardcoding the host is a bit risky but this should always be true in  test environment
      expect(link.href).toBe("http://localhost/ambiguous-slug")
    })

    it("displays a brief message about how many extensions there are", async () => {
      const num = extensions.length
      expect(screen.getByText(new RegExp(`${num -1} new extensions were added`))).toBeTruthy()
    })

    it("displays some text about when the extensions were released", async () => {
      expect(screen.getAllByText(/April 2020/)).toBeTruthy()
    })

    it("displays a next and previous links", async () => {
      expect(screen.getAllByText(/January 1970/)).toBeTruthy()
      expect(screen.getAllByText(/June 1985/)).toBeTruthy()

    })
  })

  describe("when there are no extensions in the time period", () => {

    beforeEach(async () => {

      render(<ExtensionsAddedListTemplate data={{ allExtension: { edges: [] } }}
                                          pageContext={{
                                            nextMonthTimestamp: "12",
                                            sinceMonth: "1705250589000",
                                            previousMonthTimestamp: "487592268000"
                                          }}
                                          location={"extensions-added-some-date"} />)
    })

    it("displays a brief message explaining there are no extensions", async () => {
      expect(screen.getByText(/No new extensions.*/)).toBeTruthy()
    })

    it("displays some text about when the extensions were released", async () => {
      expect(screen.getAllByText(/January 2024/)).toBeTruthy()
    })

    it("displays a next and previous links", async () => {
      expect(screen.getAllByText(/January 1970/)).toBeTruthy()
      expect(screen.getAllByText(/June 1985/)).toBeTruthy()

    })

  })
})
