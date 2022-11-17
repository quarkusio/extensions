import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import PlatformFilter from "./platform-filter"
import selectEvent from "react-select-event"

const label = "Platform"
describe("platform filter", () => {
  describe("when the list is empty", () => {
    beforeEach(() => {
      render(<PlatformFilter />)
    })

    it("renders platform title", () => {
      expect(screen.getByText("Platform")).toBeTruthy()
    })

    it("has a dropdown menu", () => {
      expect(screen.getByRole("combobox")).toBeTruthy()
    })

    it("gracefully does nothing on click", async () => {
      expect(screen.getByTestId("platform-form")).toHaveFormValues({
        platform: "",
      })
      await fireEvent.click(screen.getByRole("combobox"))
      expect(screen.getByTestId("platform-form")).toHaveFormValues({
        platform: "",
      })
    })
  })

  describe("when options are available", () => {
    const platformCode = "quarkus-non-platform-extensions"

    const filterer = jest.fn()
    beforeEach(() => {
      filterer.mockReset()

      render(
        <PlatformFilter
          filterer={filterer}
          options={["chocolate", platformCode, "strawberry"]}
        />
      )
    })

    it("renders platform title", () => {
      expect(screen.getByText("Platform")).toBeTruthy()
    })

    it("has a dropdown menu", () => {
      expect(screen.getByRole("combobox")).toBeTruthy()
    })

    it("changes the value on click", async () => {
      expect(screen.getByTestId("platform-form")).toHaveFormValues({
        platform: "",
      })
      await selectEvent.select(
        screen.getByLabelText(label),
        "Non Platform Extensions"
      )
      expect(screen.getByTestId("platform-form")).toHaveFormValues({
        platform: platformCode,
      })
    })

    it("sends a message on click", async () => {
      expect(screen.getByTestId("platform-form")).toHaveFormValues({
        platform: "",
      })
      await selectEvent.select(
        screen.getByLabelText(label),
        "Non Platform Extensions"
      )
      expect(filterer).toHaveBeenCalledWith(platformCode)
    })
  })
})
