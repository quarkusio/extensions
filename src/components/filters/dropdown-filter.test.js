import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import selectEvent from "react-select-event"
import DropdownFilter from "./dropdown-filter"

describe("dropdown menu filter", () => {
  describe("when the list is empty", () => {
    beforeEach(() => {
      render(<DropdownFilter />)
    })

    it("has a dropdown menu", () => {
      expect(screen.getByRole("combobox")).toBeTruthy()
    })

    it("gracefully does nothing on click", async () => {
      expect(screen.getByTestId("unknown-form")).toHaveFormValues({
        unknown: "",
      })
      await fireEvent.click(screen.getByRole("combobox"))
      expect(screen.getByTestId("unknown-form")).toHaveFormValues({
        unknown: "",
      })
    })
  })

  describe("when options are available", () => {
    const label = "Frogs"
    const id = label.toLowerCase() + "-form"
    const code = "632T"

    const transformerFunction = value => (value === code ? "Strawberry" : value)

    const filterer = jest.fn()
    beforeEach(() => {
      filterer.mockReset()

      render(
        <DropdownFilter
          displayLabel={label}
          filterer={filterer}
          options={["chocolate", "vanilla", code]}
          optionTransformer={transformerFunction}
        />
      )
    })

    it("has a dropdown menu", () => {
      expect(screen.getByRole("combobox")).toBeTruthy()
    })

    it("changes the value on click", async () => {
      expect(screen.getByTestId(id)).toHaveFormValues({
        frogs: "",
      })
      await selectEvent.select(screen.getByLabelText(label), "vanilla")
      expect(screen.getByTestId(id)).toHaveFormValues({
        frogs: "vanilla",
      })
    })

    it("sends a message on click", async () => {
      expect(screen.getByTestId(id)).toHaveFormValues({
        frogs: "",
      })
      await selectEvent.select(screen.getByLabelText(label), "vanilla")
      expect(filterer).toHaveBeenCalledWith("vanilla")
    })

    it("changes the value on click, using the transformer function", async () => {
      expect(screen.getByTestId(id)).toHaveFormValues({
        frogs: "",
      })
      await selectEvent.select(screen.getByLabelText(label), "Strawberry")
      expect(screen.getByTestId(id)).toHaveFormValues({
        frogs: code,
      })
    })

    it("sends a message on click, using the transformer function", async () => {
      expect(screen.getByTestId(id)).toHaveFormValues({
        frogs: "",
      })
      await selectEvent.select(screen.getByLabelText(label), "Strawberry")
      expect(filterer).toHaveBeenCalledWith(code)
    })
  })
})
