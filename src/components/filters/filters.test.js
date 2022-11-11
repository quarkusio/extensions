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
    metadata: { categories: ["lynx"] },
    origins: ["Banff"],
  }
  const pascal = {
    name: "Pascal",
    metadata: { categories: ["skunks"] },
    origins: ["Toronto"],
  }
  const fluffy = {
    name: "Fluffy",
    metadata: { categories: ["moose"] },
    origins: ["Banff"],
  }

  const extensions = [alice, pascal, fluffy]

  beforeEach(() => {
    render(
      <Filters extensions={extensions} filterAction={extensionsListener} />
    )
  })

  it("renders categories", () => {
    expect(screen.getByText("Category")).toBeTruthy()
  })

  it("renders individual categories", () => {
    expect(screen.getByText("Skunks")).toBeTruthy()
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
    })

    it("leaves in extensions which match the search filter", async () => {
      const searchInput = screen.getByRole("textbox")
      await user.click(searchInput)
      await user.keyboard("Alice")
      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).toContain(alice)
    })

    it("is case insensitive in its searching", async () => {
      const searchInput = screen.getByRole("textbox")
      await user.click(searchInput)
      await user.keyboard("alice")
      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).toContain(alice)
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
      fireEvent.click(screen.getByText(displayCategory))

      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).not.toContain(alice)
    })
  })

  describe("platform filter", () => {
    const label = "Platform"

    it("lists all the platforms in the menu", async () => {
      // Don't look at what happens, just make sure the options are there
      await selectEvent.select(screen.getByLabelText(label), "Toronto")
      await selectEvent.select(screen.getByLabelText(label), "Banff")
    })

    it("leaves in extensions which match search filter and filters out extensions which do not match", async () => {
      expect(screen.getByTestId("platform-form")).toHaveFormValues({
        platform: "",
      })
      await selectEvent.select(screen.getByLabelText(label), "Toronto")

      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).not.toContain(alice)
      expect(newExtensions).toContain(pascal)
      expect(newExtensions).not.toContain(fluffy)
    })
  })
})
