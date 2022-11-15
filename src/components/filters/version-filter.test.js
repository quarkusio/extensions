import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import VersionFilter from "./version-filter"
import selectEvent from "react-select-event"

describe("version filter", () => {
  const label = "Quarkus Version"

  describe("when the list is empty", () => {
    beforeEach(() => {
      render(<VersionFilter />)
    })

    it("renders a title", () => {
      expect(screen.getByText(label)).toBeTruthy()
    })

    it("has a dropdown menu", () => {
      expect(screen.getByRole("combobox")).toBeTruthy()
    })

    it("gracefully does nothing on click", async () => {
      expect(screen.getByTestId("quarkus-version-form")).toHaveFormValues({
        "quarkus-version": "",
      })
      await fireEvent.click(screen.getByRole("combobox"))
      expect(screen.getByTestId("quarkus-version-form")).toHaveFormValues({
        "quarkus-version": "",
      })
    })
  })

  describe("when options are available", () => {
    const filterer = jest.fn()
    beforeEach(() => {
      filterer.mockReset()

      render(
        <VersionFilter
          filterer={filterer}
          extensions={[
            { metadata: { built_with_quarkus_core: "1.1" } },
            { metadata: { built_with_quarkus_core: "1.2" } },
          ]}
        />
      )
    })

    it("renders a title", () => {
      expect(screen.getByText(label)).toBeTruthy()
    })

    it("has a dropdown menu", () => {
      expect(screen.getByRole("combobox")).toBeTruthy()
    })

    it("changes the value on click", async () => {
      expect(screen.getByTestId("quarkus-version-form")).toHaveFormValues({
        "quarkus-version": "",
      })
      await selectEvent.select(screen.getByLabelText(label), "1.1")
      expect(screen.getByTestId("quarkus-version-form")).toHaveFormValues({
        "quarkus-version": "1.1",
      })
    })

    it("sends a message on click", async () => {
      expect(screen.getByTestId("quarkus-version-form")).toHaveFormValues({
        "quarkus-version": "",
      })
      await selectEvent.select(screen.getByLabelText(label), "1.1")
      expect(filterer).toHaveBeenCalledWith("1.1")
    })
  })
})
