import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import PlatformFilter from "./platform-filter"
import selectEvent from "react-select-event"

const label = "Origin"
const nonPlatformLabel = "Other"

describe("platform filter", () => {
  describe("when the list is empty", () => {
    beforeEach(() => {
      render(<PlatformFilter />)
    })

    it("renders platform title", () => {
      expect(screen.getByText(label)).toBeTruthy()
    })

    it("has a dropdown menu", () => {
      expect(screen.getByRole("combobox")).toBeTruthy()
    })

    it("gracefully does nothing on click", async () => {
      expect(screen.getByTestId("origin-form")).toHaveFormValues({
        origin: "",
      })
      await fireEvent.click(screen.getByRole("combobox"))
      expect(screen.getByTestId("origin-form")).toHaveFormValues({
        origin: "",
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
      expect(screen.getByText(label)).toBeTruthy()
    })

    it("has a dropdown menu", () => {
      expect(screen.getByRole("combobox")).toBeTruthy()
    })

    it("changes the value on click", async () => {
      expect(screen.getByTestId("origin-form")).toHaveFormValues({
        origin: "",
      })
      await selectEvent.select(screen.getByLabelText(label), nonPlatformLabel)
      expect(screen.getByTestId("origin-form")).toHaveFormValues({
        origin: platformCode,
      })
    })

    it("sends a message on click", async () => {
      expect(screen.getByTestId("origin-form")).toHaveFormValues({
        origin: "",
      })
      await selectEvent.select(screen.getByLabelText(label), nonPlatformLabel)
      expect(filterer).toHaveBeenCalledWith(platformCode)
    })
  })
})
