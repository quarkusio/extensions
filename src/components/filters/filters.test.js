import React from "react"
import { render, screen } from "@testing-library/react"
import Filters from "./filters"
import selectEvent from "react-select-event"
import userEvent from "@testing-library/user-event"
import { Context as ResponsiveContext } from "react-responsive"

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
  const extensionsListener = jest.fn()

  const alice = {
    name: "Alice Blaine",
    description: "a nice person",
    artifact: "io.something:some-artifact-name::jar:3.10.2",
    metadata: {
      categories: ["lynx"],
      status: ["wonky"],
      quarkus_core_compatibility: "UNKNOWN",
    },
    platforms: ["Banff"],
  }
  const pascal = {
    name: "Pascal",
    artifact: "io.something:another-artifact-name::jar:3.10.2",
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

  describe("at a desktop screen size", () => {
    let user
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
      expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([secret]))
    })

    it("excludes superseded extensions", () => {
      expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([stale]))
    })

    describe("searching", () => {

      it("filters out extensions which do not match the search filter", async () => {
        const searchInput = screen.getByRole("textbox")
        await user.click(searchInput)
        await user.keyboard("octopus")
        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([fluffy]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([secret]))
      })

      it("leaves in extensions whose name match the search filter", async () => {
        const searchInput = screen.getByRole("textbox")
        await user.click(searchInput)
        await user.keyboard("Alice")
        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([fluffy]))
      })

      it("leaves in extensions whose description match the search filter", async () => {
        const searchInput = screen.getByRole("textbox")
        await user.click(searchInput)
        await user.keyboard("nice")
        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
      })

      it("leaves in extensions whose id matches the search filter", async () => {
        const searchInput = screen.getByRole("textbox")
        await user.click(searchInput)
        await user.keyboard(alice.artifact.substring(0, 20)) // The full artifact with the ::jar won't work
        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.not.arrayContaining([pascal]))
      })

      it("is case insensitive in its searching", async () => {
        const searchInput = screen.getByRole("textbox")
        await user.click(searchInput)
        await user.keyboard("alice")
        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))

        // select all and clear the search term
        searchInput.setSelectionRange(0, searchInput.value.length)
        await user.keyboard("pAScal")
        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
      })

      it("does not count the jar part in the maven artifact as a match", async () => {
        const searchInput = screen.getByRole("textbox")
        await user.click(searchInput)
        await user.keyboard("jar")
        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).toHaveBeenLastCalledWith([])
      })

      describe("for an unlisted extension", () => {

        it("filters out unlisted extensions if the search string is too short to be meaningful", async () => {
          const searchInput = screen.getByRole("textbox")
          await user.click(searchInput)
          await user.keyboard("j")
          expect(extensionsListener).toHaveBeenCalled()
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([fluffy]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([secret]))
        })

        it("shows unlisted extensions if the search string has a meaningful length", async () => {
          const searchInput = screen.getByRole("textbox")
          await user.click(searchInput)
          await user.keyboard("jame")
          expect(extensionsListener).toHaveBeenCalled()

          expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([secret]))

          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([fluffy]))
        })

        it("is case insensitive in its searching", async () => {
          const searchInput = screen.getByRole("textbox")
          await user.click(searchInput)
          await user.keyboard("alice")
          expect(extensionsListener).toHaveBeenCalled()
          expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        })
      })

      describe("for a superseded extension", () => {

        it("filters out superseded extensions if the search string is too short to be meaningful", async () => {
          const searchInput = screen.getByRole("textbox")
          await user.click(searchInput)
          await user.keyboard("j")
          expect(extensionsListener).toHaveBeenCalled()
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([fluffy]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([secret]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([stale]))

        })

        it("shows superseded extensions if the search string has a meaningful length", async () => {
          const searchInput = screen.getByRole("textbox")
          await user.click(searchInput)
          await user.keyboard("last")
          expect(extensionsListener).toHaveBeenCalled()

          expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([stale]))

          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([fluffy]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([secret]))
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
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
      })

      it("filters out extensions which do not match the ticked category", async () => {
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        await user.click(screen.getByText(displayCategory))

        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
      })

      it("reinstates extensions when a category is unticked", async () => {
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))

        await user.click(screen.getByText(displayCategory))
        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))

        await user.click(screen.getByText(displayCategory))
        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
      })

      it("excludes unlisted extensions", () => {
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([secret]))
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
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
      })

      it("filters out extensions which do not match the ticked keyword", async () => {
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        await user.click(screen.getByText(displayKeyword))

        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
      })

      it("reinstates extensions when a keyword is unticked", async () => {
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))

        await user.click(screen.getByText(displayKeyword))
        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))

        await user.click(screen.getByText(displayKeyword))
        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
      })

      it("excludes unlisted extensions", () => {
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([secret]))
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
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([fluffy]))
      })

      it("leaves in extensions which match another status filter and filters out extensions which do not match", async () => {
        expect(screen.getByTestId("status-form")).toHaveFormValues({
          status: "",
        })
        await selectEvent.select(screen.getByLabelText(label), "sparkling")

        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([fluffy]))
      })

      it("leaves in all extensions when 'All' is selected", async () => {
        expect(screen.getByTestId("status-form")).toHaveFormValues({
          status: "",
        })
        await selectEvent.select(screen.getByLabelText(label), "sparkling")
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))

        await selectEvent.select(screen.getByLabelText(label), "All")

        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([fluffy]))
      })

      it("excludes unlisted extensions", () => {
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([secret]))
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
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([fluffy]))
      })

      it("leaves in extensions which match another compatibility filter and filters out extensions which do not match", async () => {
        expect(screen.getByTestId("compatibility-form")).toHaveFormValues({
          "built-with": "",
        })
        await selectEvent.select(screen.getByLabelText(label), "Compatible")

        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([fluffy]))
      })
    })
  })

  describe("at a mobile screen size", () => {
    let user

    const menuTitle = "Filter"
    const listItem = "Status"
    const menuOpen = "Filter By"
    const menuClosed = "sliders"

    beforeEach(() => {
      user = userEvent.setup({ skipHover: true })
      mockQueryParamSearchStrings = {}

      render(
        <ResponsiveContext.Provider value={{ width: 300, type: "screen" }}>
          <Filters
            extensions={extensions}
            categories={categories}
            keywords={keywords}
            filterAction={extensionsListener}
          />
        </ResponsiveContext.Provider>
      )
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it("shows the title", () => {
      expect(screen.getByText(menuTitle)).toBeInTheDocument()
    })

    it("calls listeners", () => {
      expect(extensionsListener).toHaveBeenCalled()
    })

    it("shows the menu as closed before any click", async () => {
      expect(screen.queryByTitle(menuOpen)).toBeNull()
      expect(screen.getByTitle(menuClosed)).toBeInTheDocument()
    })

    it("clicking on the menu brings up a dropdown and shows the contents", async () => {
      await user.click(screen.getByText(menuTitle))
      expect(screen.getByText(listItem)).toBeTruthy() // This will always be in the document, because of hidden content
      expect(screen.queryByTitle(menuClosed)).toBeNull()
    })

    it("clicking done after opening the menu closes it", async () => {
      await user.click(screen.getByText(menuTitle))
      expect(screen.queryByTitle(menuClosed)).toBeNull()
      expect(screen.getByText(menuOpen)).toBeInTheDocument()

      await user.click(screen.getByTitle("Done"))

      expect(screen.queryByText(menuOpen)).toBeNull()
      expect(screen.getByTitle(menuClosed)).toBeInTheDocument()
    })

    it("renders categories", async () => {
      await user.click(screen.getByText(menuTitle))
      expect(screen.getByText("Category")).toBeTruthy()
    })

    it("excludes unlisted extensions", () => {
      expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([secret]))
    })

    it("excludes superseded extensions", () => {
      expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([stale]))
    })

    describe("searching", () => {

      it("filters out extensions which do not match the search filter", async () => {
        await user.click(screen.getByText(menuTitle))
        const searchInput = screen.getByRole("textbox")
        await user.click(searchInput)
        await user.keyboard("octopus")
        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([fluffy]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([secret]))
      })

      it("leaves in extensions whose name match the search filter", async () => {
        await user.click(screen.getByText(menuTitle))
        const searchInput = screen.getByRole("textbox")
        await user.click(searchInput)
        await user.keyboard("Alice")
        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([secret]))
      })

      it("leaves in extensions whose description match the search filter", async () => {
        await user.click(screen.getByText(menuTitle))
        const searchInput = screen.getByRole("textbox")
        await user.click(searchInput)
        await user.keyboard("nice")
        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
      })

      it("leaves in extensions whose id match the search filter", async () => {
        await user.click(screen.getByText(menuTitle))
        const searchInput = screen.getByRole("textbox")
        await user.click(searchInput)
        await user.keyboard(alice.artifact.substring(0, 20))
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.not.arrayContaining([pascal]))
      })

      it("is case insensitive in its searching", async () => {
        await user.click(screen.getByText(menuTitle))
        const searchInput = screen.getByRole("textbox")
        await user.click(searchInput)
        await user.keyboard("alice")
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
      })

      describe("for an unlisted extension", () => {

        it("filters out unlisted extensions if the search string is too short to be meaningful", async () => {
          await user.click(screen.getByText(menuTitle))
          const searchInput = screen.getByRole("textbox")
          await user.click(searchInput)
          await user.keyboard("j")
          expect(extensionsListener).toHaveBeenCalled()
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([fluffy]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([secret]))
        })

        it("shows unlisted extensions if the search string has a meaningful length", async () => {
          await user.click(screen.getByText(menuTitle))
          const searchInput = screen.getByRole("textbox")
          await user.click(searchInput)
          await user.keyboard("jame")
          expect(extensionsListener).toHaveBeenCalled()

          expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([secret]))

          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([fluffy]))
        })

        it("is case insensitive in its searching", async () => {
          await user.click(screen.getByText(menuTitle))
          const searchInput = screen.getByRole("textbox")
          await user.click(searchInput)
          await user.keyboard("alice")
          expect(extensionsListener).toHaveBeenCalled()
          expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        })
      })

      describe("for a superseded extension", () => {

        it("filters out superseded extensions if the search string is too short to be meaningful", async () => {
          await user.click(screen.getByText(menuTitle))
          const searchInput = screen.getByRole("textbox")
          await user.click(searchInput)
          await user.keyboard("j")
          expect(extensionsListener).toHaveBeenCalled()
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([stale]))

          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([fluffy]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([secret]))

        })

        it("shows superseded extensions if the search string has a meaningful length", async () => {
          await user.click(screen.getByText(menuTitle))
          const searchInput = screen.getByRole("textbox")
          await user.click(searchInput)
          await user.keyboard("last")
          expect(extensionsListener).toHaveBeenCalled()

          expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([stale]))

          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([fluffy]))
          expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([secret]))
        })
      })

    })

    describe("category filter", () => {
      const displayCategory = "Skunks"

      it("does not show any contents before expanding the twisty", async () => {
        await user.click(screen.getByText(menuTitle))
        expect(screen.queryAllByText(displayCategory)).toHaveLength(0)
      })

      it("has a list of categories", async () => {
        await user.click(screen.getByText(menuTitle))
        await user.click(screen.getByTestId("category-twisty"))
        expect(screen.queryAllByText(displayCategory)).toHaveLength(1)
      })

      it("leaves in extensions which match category filter", async () => {
        await user.click(screen.getByText(menuTitle))
        await user.click(screen.getByTestId("category-twisty"))
        await user.click(screen.getByText(displayCategory))

        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
      })

      it("filters out extensions which do not match the ticked category", async () => {
        await user.click(screen.getByText(menuTitle))
        await user.click(screen.getByTestId("category-twisty"))
        await user.click(screen.getByText(displayCategory))

        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
      })

      it("reinstates extensions when a category is unticked", async () => {
        await user.click(screen.getByText(menuTitle))
        await user.click(screen.getByTestId("category-twisty"))
        await user.click(screen.getByText(displayCategory))
        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))

        await user.click(screen.getByText(displayCategory))
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))

      })

      it("excludes unlisted extensions", () => {
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([secret]))
      })
    })

    describe("keyword filter", () => {
      const displayKeyword = "Cool"

      it("has a list of keywords", async () => {
        await user.click(screen.getByText(menuTitle))
        expect(screen.queryAllByText(displayKeyword)).toHaveLength(1)
      })

      it("leaves in extensions which match keyword filter", async () => {
        await user.click(screen.getByText(menuTitle))
        await user.click(screen.getByText(displayKeyword))

        expect(extensionsListener).toHaveBeenCalled()

        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
      })

      it("filters out extensions which do not match the ticked keyword", async () => {
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        await user.click(screen.getByText(menuTitle))
        await user.click(screen.getByText(displayKeyword))

        expect(extensionsListener).toHaveBeenCalled()

        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
      })

      it("reinstates extensions when a keyword is unticked", async () => {
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))

        await user.click(screen.getByText(menuTitle))
        await user.click(screen.getByText(displayKeyword))
        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))

        await user.click(screen.getByText(displayKeyword))
        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
      })

      it("excludes unlisted extensions", () => {
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([secret]))
      })
    })


    describe("status filter", () => {

      it("lists all the statuses in the menu", async () => {
        await user.click(screen.getByText(menuTitle))
        await user.click(screen.getByTestId("status-twisty"))

        // Don't look at what happens, just make sure the options are there
        await screen.getByText("wonky")
        await screen.getByText("shonky")
        await screen.getByText("sparkling")
      })

      it("leaves in extensions which match status filter and filters out extensions which do not match", async () => {
        await user.click(screen.getByText(menuTitle))
        await user.click(screen.getByTestId("status-twisty"))

        await selectEvent.select(screen.getByTestId("status-twisty"), "wonky")

        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([fluffy]))
      })

      it("leaves in extensions which match another status filter and filters out extensions which do not match", async () => {
        await user.click(screen.getByText(menuTitle))
        await user.click(screen.getByTestId("status-twisty"))

        await selectEvent.select(screen.getByTestId("status-twisty"), "sparkling")

        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([fluffy]))
      })

      it("excludes unlisted extensions", () => {
        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([secret]))
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
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([fluffy]))
      })

      it("leaves in extensions which match another compatibility filter and filters out extensions which do not match", async () => {
        expect(screen.getByTestId("compatibility-form")).toHaveFormValues({
          "built-with": "",
        })
        await selectEvent.select(screen.getByLabelText(label), "Compatible")

        expect(extensionsListener).toHaveBeenCalled()
        expect(extensionsListener).not.toHaveBeenLastCalledWith(expect.arrayContaining([alice]))
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([pascal]))
        expect(extensionsListener).toHaveBeenLastCalledWith(expect.arrayContaining([fluffy]))
      })
    })
  })
})
