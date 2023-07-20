import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ExtensionsList from "./extensions-list"

describe("extension list", () => {
  const category = "jewellery"
  const displayCategory = "Jewellery"
  const otherCategory = "snails"

  const ruby = {
    name: "JRuby",
    id: "jruby",
    sortableName: "ruby",
    slug: "jruby-slug",
    metadata: { categories: [category] },
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
    sortableName: "maybe-old",
    slug: "ambiguous-slug",
    metadata: { categories: [otherCategory] },
    platforms: ["bottom of the garden"],
    duplicates: [{ relationship: "different", groupId: "whatever" }],
  }

  const extensions = [ruby, diamond, molluscs, obsolete, maybeObsolete]
  const categories = [otherCategory, category]

  const user = userEvent.setup()

  beforeEach(() => {
    render(<ExtensionsList extensions={extensions} categories={categories} />)
  })

  it("renders the extension name", () => {
    expect(screen.getByText(extensions[0].name)).toBeTruthy()
  })

  it("renders the correct link", () => {
    const link = screen.getAllByRole("link")[3] // Look at the fourth one - this is also testing the sorting
    expect(link).toBeTruthy()
    // Hardcoding the host is a bit risky but this should always be true in  test environment
    expect(link.href).toBe("http://localhost/jruby-slug")
  })

  it("filters out extensions which have been superseded", async () => {
    expect(screen.queryByText(obsolete.name)).toBeFalsy()
  })

  // If the relationship is 'different' we don't know which is newer or older, so we better leave it in
  it("leaves in extensions which might have been superseded if we can't tell for sure", async () => {
    expect(screen.queryByText(maybeObsolete.name)).toBeInTheDocument()
  })

  it("displays a brief message about how many extensions there are", async () => {
    // The superceded extension should not be counted
    const num = extensions.length - 1
    expect(screen.getByText(`Showing ${num} extensions`)).toBeTruthy()
  })

  describe("searching and filtering", () => {
    describe("searching", () => {
      it("filters out extensions which do not match the search filter", async () => {
        const searchInput = screen.getByRole("textbox")
        await user.click(searchInput)
        await user.keyboard("octopus")
        expect(screen.queryByText(ruby.name)).toBeFalsy()
      })

      it("leaves in extensions which match the search filter", async () => {
        const searchInput = screen.getByRole("textbox")
        await user.click(searchInput)
        await user.keyboard("Ruby")
        expect(screen.queryByText(ruby.name)).toBeTruthy()
      })

      it("is case insensitive in its searching", async () => {
        const searchInput = screen.getByRole("textbox")
        await user.click(searchInput)
        await user.keyboard("ruby")
        expect(screen.queryByText(ruby.name)).toBeTruthy()
      })
    })

    describe("category filter", () => {
      it("has a list of categories", async () => {
        expect(screen.queryAllByText(displayCategory)).toHaveLength(1) // One for the filter, and in the card the name is concatenated with something else
      })

      it("leaves in extensions which match category filter", async () => {
        fireEvent.click(screen.getByText(displayCategory))

        expect(screen.queryByText(ruby.name)).toBeTruthy()
        expect(screen.queryByText(diamond.name)).toBeTruthy()
      })

      it("filters out extensions which do not match the ticked category", async () => {
        fireEvent.click(screen.getByText(displayCategory))

        expect(screen.queryByText(molluscs.name)).toBeFalsy()
      })

      it("displays a longer message about how many extensions are still shown", async () => {
        fireEvent.click(screen.getByText(displayCategory))

        const total = extensions.length - 1
        expect(
          screen.getByText(`Showing 2 matching of ${total} extensions`)
        ).toBeTruthy()
      })
    })
  })
})
