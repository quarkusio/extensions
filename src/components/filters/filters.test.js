import React from "react"
import { render, screen } from "@testing-library/react"
import Filters from "./filters"
import selectEvent from "react-select-event"
import userEvent from "@testing-library/user-event"

let mockQueryParamSearchStrings = undefined

// We have multiple things using the query string, so we need to pay attention to keys to avoid mixing up different elements
jest.mock("react-use-query-param-string", () => {

  const original = jest.requireActual("react-use-query-param-string")
  return {
    ...original,
    useQueryParamString: jest.fn().mockImplementation((key) => [mockQueryParamSearchStrings[key], jest.fn().mockImplementation((val) => {
      mockQueryParamSearchStrings[key] = val
    }), true])
  }
})

describe("filters bar", () => {
  let user
  let newExtensions
  const extensionsListener = jest.fn(extensions => (newExtensions = extensions))

  const alice = {
    name: "Alice",
    description: "a nice person",
    artifact: "some complex id",
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
      keywords: ["cool"],
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

  const stale = {
    name: "Last Year's News",
    isSuperseded: true,
    metadata: {
      categories: ["moose"],
      status: "wonky",
      quarkus_core_compatibility: "COMPATIBLE",
    },
    platforms: ["Toronto"],
  }

  const extensions = [alice, pascal, fluffy, stale, secret]
  const categories = ["moose", "skunks", "lynx"]
  const keywords = ["shiny", "cool", "sad"]

  beforeEach(() => {
    user = userEvent.setup()
    mockQueryParamSearchStrings = {}
    render(
      <Filters
        extensions={extensions}
        categories={categories}
        keywords={keywords}
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

  it("excludes superseded extensions", () => {
    expect(newExtensions).not.toContain(stale)
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

    it("leaves in extensions whose id match the search filter", async () => {
      const searchInput = screen.getByRole("textbox")
      await user.click(searchInput)
      await user.keyboard(alice.artifact)
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

    describe("for a superseded extension", () => {
      const user = userEvent.setup()

      it("filters out superseded extensions if the search string is too short to be meaningful", async () => {
        const searchInput = screen.getByRole("textbox")
        await user.click(searchInput)
        await user.keyboard("j")
        expect(extensionsListener).toHaveBeenCalled()
        expect(newExtensions).not.toContain(alice)
        expect(newExtensions).not.toContain(pascal)
        expect(newExtensions).not.toContain(fluffy)
        expect(newExtensions).not.toContain(secret)
        expect(newExtensions).not.toContain(stale)

      })

      it("shows superseded extensions if the search string has a meaningful length", async () => {
        const searchInput = screen.getByRole("textbox")
        await user.click(searchInput)
        await user.keyboard("last")
        expect(extensionsListener).toHaveBeenCalled()

        expect(newExtensions).toContain(stale)

        expect(newExtensions).not.toContain(secret)
        expect(newExtensions).not.toContain(alice)
        expect(newExtensions).not.toContain(pascal)
        expect(newExtensions).not.toContain(fluffy)
      })
    })

  })

  describe("category filter", () => {
    const displayCategory = "Skunks"

    it("has a list of categories", async () => {
      expect(screen.queryAllByText(displayCategory)).toHaveLength(1)
    })

    it("leaves in extensions which match category filter", async () => {
      await user.click(screen.getByText(displayCategory))

      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).toContain(pascal)
    })

    it("filters out extensions which do not match the ticked category", async () => {
      expect(newExtensions).toContain(alice)
      await user.click(screen.getByText(displayCategory))

      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).not.toContain(alice)
    })

    it("reinstates extensions when a category is unticked", async () => {
      expect(newExtensions).toContain(alice)

      await user.click(screen.getByText(displayCategory))
      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).not.toContain(alice)

      await user.click(screen.getByText(displayCategory))
      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).toContain(alice)
    })

    it("excludes unlisted extensions", () => {
      expect(newExtensions).not.toContain(secret)
    })
  })

  describe("keyword filter", () => {
    const displayKeyword = "Cool"

    it("has a list of keywords", async () => {
      expect(screen.queryAllByText(displayKeyword)).toHaveLength(1)
    })

    it("leaves in extensions which match keyword filter", async () => {
      await user.click(screen.getByText(displayKeyword))

      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).toContain(pascal)
    })

    it("filters out extensions which do not match the ticked keyword", async () => {
      expect(newExtensions).toContain(alice)
      await user.click(screen.getByText(displayKeyword))

      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).not.toContain(alice)
    })

    it("reinstates extensions when a keyword is unticked", async () => {
      expect(newExtensions).toContain(alice)

      await user.click(screen.getByText(displayKeyword))
      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).not.toContain(alice)

      await user.click(screen.getByText(displayKeyword))
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

    it("leaves in extensions which match another status filter and filters out extensions which do not match", async () => {
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

    it("leaves in extensions which match another status filter and filters out extensions which do not match", async () => {
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

  describe.skip("compatibility filter", () => {
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

    it("leaves in extensions which match another compatibility filter and filters out extensions which do not match", async () => {
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
