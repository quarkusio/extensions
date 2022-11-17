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
      built_with_quarkus_core: "4.2",
      quarkus_core_compatibility: "UNKNOWN",
    },
    platforms: ["Banff"],
  }
  const pascal = {
    name: "Pascal",
    metadata: {
      categories: ["skunks"],
      built_with_quarkus_core: "63.5",
      quarkus_core_compatibility: "COMPATIBLE",
    },
    platforms: ["Toronto"],
  }
  const fluffy = {
    name: "Fluffy",
    metadata: {
      categories: ["moose"],
      built_with_quarkus_core: "63.5",
      quarkus_core_compatibility: "COMPATIBLE",
    },
    platforms: ["Banff"],
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

    it("leaves in extensions whose name match the search filter", async () => {
      const searchInput = screen.getByRole("textbox")
      await user.click(searchInput)
      await user.keyboard("Alice")
      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).toContain(alice)
      expect(newExtensions).not.toContain(pascal)
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

  describe("quarkus version filter", () => {
    const label = "Quarkus Version"

    it("lists all the versions in the menu", async () => {
      // Don't look at what happens, just make sure the options are there
      await selectEvent.select(screen.getByLabelText(label), "4.2")
      await selectEvent.select(screen.getByLabelText(label), "63.5")
    })

    it("leaves in extensions which match version filter and filters out extensions which do not match", async () => {
      expect(screen.getByTestId("quarkus-version-form")).toHaveFormValues({
        "quarkus-version": "",
      })
      await selectEvent.select(screen.getByLabelText(label), "4.2")

      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).toContain(alice)
      expect(newExtensions).not.toContain(pascal)
      expect(newExtensions).not.toContain(fluffy)
    })

    it("leaves in extensions which match version filter and filters out extensions which do not match", async () => {
      expect(screen.getByTestId("quarkus-version-form")).toHaveFormValues({
        "quarkus-version": "",
      })
      await selectEvent.select(screen.getByLabelText(label), "63.5")

      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).not.toContain(alice)
      expect(newExtensions).toContain(pascal)
      expect(newExtensions).toContain(fluffy)
    })
  })

  xdescribe("compatibility filter", () => {
    const label = "Compatibility"

    it("lists all the versions in the menu", async () => {
      // Don't look at what happens, just make sure the options are there
      await selectEvent.select(screen.getByLabelText(label), "Unknown")
      await selectEvent.select(screen.getByLabelText(label), "Compatible")
    })

    it("leaves in extensions which match version filter and filters out extensions which do not match", async () => {
      expect(screen.getByTestId("quarkus-version-form")).toHaveFormValues({
        "quarkus-version": "",
      })
      await selectEvent.select(screen.getByLabelText(label), "Unknown")

      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).toContain(alice)
      expect(newExtensions).not.toContain(pascal)
      expect(newExtensions).not.toContain(fluffy)
    })

    it("leaves in extensions which match version filter and filters out extensions which do not match", async () => {
      expect(screen.getByTestId("quarkus-version-form")).toHaveFormValues({
        "quarkus-version": "",
      })
      await selectEvent.select(screen.getByLabelText(label), "Compatible")

      expect(extensionsListener).toHaveBeenCalled()
      expect(newExtensions).not.toContain(alice)
      expect(newExtensions).toContain(pascal)
      expect(newExtensions).toContain(fluffy)
    })
  })
})
