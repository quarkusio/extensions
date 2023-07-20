import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import Filters from "./filters"
import selectEvent from "react-select-event"
import userEvent from "@testing-library/user-event"

describe("filters bar", () => {
  let newExtensions
  const extensionsListener = jest.fn(extensions => (newExtensions = extensions))

  const alice = {
    name: "Alice",
    description: "a nice person",
    metadata: {
      categories: ["lynx"],
      status: "wonky",
      quarkus_core_compatibility: "UNKNOWN",
    },
    platforms: ["Banff"],
  }
  const pascal = {
    name: "Pascal",
    metadata: {
      categories: ["skunks"],
      status: "shonky",
      quarkus_core_compatibility: "COMPATIBLE",
    },
    platforms: ["Toronto"],
  }
  const fluffy = {
    name: "Fluffy",
    metadata: {
      categories: ["moose"],
      status: "sparkling",
      quarkus_core_compatibility: "COMPATIBLE",
    },
    platforms: ["Banff"],
  }
  const secret = {
    name: "James Bond",
    metadata: {
      categories: ["moose"],
      status: "wonky",
      quarkus_core_compatibility: "COMPATIBLE",
      unlisted: true,
    },
    platforms: ["Banff"],
  }

  const extensions = [alice, pascal, fluffy, secret]
  const categories = ["moose", "skunks", "lynx"]

  beforeEach(() => {
    render(
      <Filters
        extensions={extensions}
        categories={categories}
        filterAction={extensionsListener}
      />
    )
  })

  it("renders categories", () => {
    expect(screen.getByText("Category")).toBeTruthy()
  })

  it("renders individual categories", () => {
    expect(screen.getByText("Skunks")).toBeTruthy()
  })

  it("excludes unlisted extensions", () => {
    expect(newExtensions).not.toContain(secret)
  })

  describe("searching", () => {
    const user = userEvent.setup()

    it("filters out extensions which do not match the search filter", async () => {
      const searchInput = screen.getByRole("textbox")
      await user.click(searchInput)
      await user.keyboard("octopus")
      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).not.toContain(alice)
      expect(newExtensions).not.toContain(pascal)
      expect(newExtensions).not.toContain(fluffy)
      expect(newExtensions).not.toContain(secret)
    })

    it("leaves in extensions whose name match the search filter", async () => {
      const searchInput = screen.getByRole("textbox")
      await user.click(searchInput)
      await user.keyboard("Alice")
      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).toContain(alice)
      expect(newExtensions).not.toContain(pascal)
      expect(newExtensions).not.toContain(secret)
    })

    it("leaves in extensions whose description match the search filter", async () => {
      const searchInput = screen.getByRole("textbox")
      await user.click(searchInput)
      await user.keyboard("nice")
      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).toContain(alice)
      expect(newExtensions).not.toContain(pascal)
    })

    it("is case insensitive in its searching", async () => {
      const searchInput = screen.getByRole("textbox")
      await user.click(searchInput)
      await user.keyboard("alice")
      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).toContain(alice)
    })

    describe("for an unlisted extension", () => {
      const user = userEvent.setup()

      it("filters out unlisted extensions if the search string is too short to be meaningful", async () => {
        const searchInput = screen.getByRole("textbox")
        await user.click(searchInput)
        await user.keyboard("j")
        expect(extensionsListener).toHaveBeenCalled()
        expect(newExtensions).not.toContain(alice)
        expect(newExtensions).not.toContain(pascal)
        expect(newExtensions).not.toContain(fluffy)
        expect(newExtensions).not.toContain(secret)
      })

      it("shows unlisted extensions if the search string has a meaningful length", async () => {
        const searchInput = screen.getByRole("textbox")
        await user.click(searchInput)
        await user.keyboard("jame")
        expect(extensionsListener).toHaveBeenCalled()

        expect(newExtensions).toContain(secret)

        expect(newExtensions).not.toContain(alice)
        expect(newExtensions).not.toContain(pascal)
        expect(newExtensions).not.toContain(fluffy)
      })

      it("is case insensitive in its searching", async () => {
        const searchInput = screen.getByRole("textbox")
        await user.click(searchInput)
        await user.keyboard("alice")
        expect(extensionsListener).toHaveBeenCalled()
        expect(newExtensions).toContain(alice)
      })
    })
  })

  describe("category filter", () => {
    const displayCategory = "Skunks"

    it("has a list of categories", async () => {
      expect(screen.queryAllByText(displayCategory)).toHaveLength(1)
    })

    it("leaves in extensions which match category filter", async () => {
      fireEvent.click(screen.getByText(displayCategory))

      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).toContain(pascal)
    })

    it("filters out extensions which do not match the ticked category", async () => {
      expect(newExtensions).toContain(alice)
      fireEvent.click(screen.getByText(displayCategory))

      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).not.toContain(alice)
    })

    it("reinstates extensions when a category is unticked", async () => {
      expect(newExtensions).toContain(alice)

      fireEvent.click(screen.getByText(displayCategory))
      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).not.toContain(alice)

      fireEvent.click(screen.getByText(displayCategory))
      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).toContain(alice)
    })

    it("excludes unlisted extensions", () => {
      expect(newExtensions).not.toContain(secret)
    })
  })

  describe("status filter", () => {
    const label = "Status"

    it("lists all the statuses in the menu", async () => {
      // Don't look at what happens, just make sure the options are there
      await selectEvent.select(screen.getByLabelText(label), "wonky")
      await selectEvent.select(screen.getByLabelText(label), "shonky")
      await selectEvent.select(screen.getByLabelText(label), "sparkling")
    })

    it("leaves in extensions which match status filter and filters out extensions which do not match", async () => {
      expect(screen.getByTestId("status-form")).toHaveFormValues({
        status: "",
      })
      await selectEvent.select(screen.getByLabelText(label), "wonky")

      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).toContain(alice)
      expect(newExtensions).not.toContain(pascal)
      expect(newExtensions).not.toContain(fluffy)
    })

    it("leaves in extensions which match status filter and filters out extensions which do not match", async () => {
      expect(screen.getByTestId("status-form")).toHaveFormValues({
        status: "",
      })
      await selectEvent.select(screen.getByLabelText(label), "sparkling")

      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).not.toContain(alice)
      expect(newExtensions).not.toContain(pascal)
      expect(newExtensions).toContain(fluffy)
    })

    it("leaves in all extensions when 'All' is selected", async () => {
      expect(screen.getByTestId("status-form")).toHaveFormValues({
        status: "",
      })
      await selectEvent.select(screen.getByLabelText(label), "sparkling")
      expect(newExtensions).not.toContain(alice)

      await selectEvent.select(screen.getByLabelText(label), "All")

      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).toContain(alice)
      expect(newExtensions).toContain(pascal)
      expect(newExtensions).toContain(fluffy)
    })

    it("excludes unlisted extensions", () => {
      expect(newExtensions).not.toContain(secret)
    })
  })

  describe("quarkus status filter", () => {
    const label = "Status"

    it("lists all the statuses in the menu", async () => {
      // Don't look at what happens, just make sure the options are there
      await selectEvent.select(screen.getByLabelText(label), "wonky")
      await selectEvent.select(screen.getByLabelText(label), "shonky")
      await selectEvent.select(screen.getByLabelText(label), "sparkling")
    })

    it("leaves in extensions which match status filter and filters out extensions which do not match", async () => {
      expect(screen.getByTestId("status-form")).toHaveFormValues({
        status: "",
      })
      await selectEvent.select(screen.getByLabelText(label), "wonky")

      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).toContain(alice)
      expect(newExtensions).not.toContain(pascal)
      expect(newExtensions).not.toContain(fluffy)
    })

    it("leaves in extensions which match status filter and filters out extensions which do not match", async () => {
      expect(screen.getByTestId("status-form")).toHaveFormValues({
        status: "",
      })
      await selectEvent.select(screen.getByLabelText(label), "sparkling")

      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).not.toContain(alice)
      expect(newExtensions).not.toContain(pascal)
      expect(newExtensions).toContain(fluffy)
    })

    it("excludes unlisted extensions", () => {
      expect(newExtensions).not.toContain(secret)
    })
  })

  xdescribe("compatibility filter", () => {
    const label = "Compatibility"

    it("lists all the compatibilities in the menu", async () => {
      // Don't look at what happens, just make sure the options are there
      await selectEvent.select(screen.getByLabelText(label), "Unknown")
      await selectEvent.select(screen.getByLabelText(label), "Compatible")
    })

    it("leaves in extensions which match compatibility filter and filters out extensions which do not match", async () => {
      expect(screen.getByTestId("compatibility-form")).toHaveFormValues({
        "built-with": "",
      })
      await selectEvent.select(screen.getByLabelText(label), "Unknown")

      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).toContain(alice)
      expect(newExtensions).not.toContain(pascal)
      expect(newExtensions).not.toContain(fluffy)
    })

    it("leaves in extensions which match compatibility filter and filters out extensions which do not match", async () => {
      expect(screen.getByTestId("compatibility-form")).toHaveFormValues({
        "built-with": "",
      })
      await selectEvent.select(screen.getByLabelText(label), "Compatible")

      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).not.toContain(alice)
      expect(newExtensions).toContain(pascal)
      expect(newExtensions).toContain(fluffy)
    })
  })
})
