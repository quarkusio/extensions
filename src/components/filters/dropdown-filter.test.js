import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import selectEvent from "react-select-event"
import DropdownFilter from "./dropdown-filter"
import { useQueryParamString } from "react-use-query-param-string"


let mockQueryParamSearchString = undefined
let rerender = undefined

jest.mock("react-use-query-param-string", () => {

  const original = jest.requireActual("react-use-query-param-string")
  const setQueryParam = jest.fn().mockImplementation((val) => {
    mockQueryParamSearchString = val
  })
  return {
    ...original,
    useQueryParamString: jest.fn().mockImplementation(() => [mockQueryParamSearchString, setQueryParam, true]),
  }
})

describe("dropdown menu filter", () => {
  describe("when the list is empty", () => {
    beforeEach(() => {
      render(<DropdownFilter />)
    })

    it("has a dropdown menu", () => {
      expect(screen.getByRole("combobox")).toBeTruthy()
    })

    it("has an option to reset", async () => {
      await selectEvent.openMenu(screen.getByTestId("unknown-form"))
      expect(screen.getByText("All")).toBeTruthy()
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
    const duplicate = "duplicated"

    const transformerFunction = value => (value === code ? "Strawberry" : value)

    const filterer = jest.fn(() => {
      // cheat, since normally the parent will force a rerender, and the child does not use usestate to avoid infinite loops
      if (rerender) {
        try {
          rerender()
        } catch (e) {
          // This can happen if the component is already unmounted
        }
      }
    })
    beforeEach(() => {
      filterer.mockReset()
      mockQueryParamSearchString = undefined

      const options = [duplicate, "vanilla", "chocolate", duplicate, code]

      const products = render(
        <DropdownFilter
          displayLabel={label}
          filterer={filterer}
          options={options}
          optionTransformer={transformerFunction}
        />
      )


      rerender = () => products.rerender(<DropdownFilter
        displayLabel={label}
        filterer={filterer}
        options={options}
        optionTransformer={transformerFunction}
      />)

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

    it("sets query parameters", async () => {

      const [, setQueryParam] = useQueryParamString()
      expect(screen.getByTestId(id)).toHaveFormValues({
        frogs: "",
      })
      await selectEvent.select(screen.getByLabelText(label), "Strawberry")

      expect(setQueryParam).toHaveBeenCalledWith("632T")
    })

    it("has an option to reset", async () => {
      await selectEvent.openMenu(screen.getByLabelText(label))
      // In the dom, there are two Alls, one placeholder and one real one
      expect(screen.getAllByText("All")).toHaveLength(2)
    })

    it("sends a reset message when All is clicked", async () => {
      expect(screen.getByTestId(id)).toHaveFormValues({
        frogs: "",
      })
      await selectEvent.select(screen.getByLabelText(label), "All")
      expect(filterer).toHaveBeenCalledWith("")
    })

    it("renders menu entries", async () => {
      await selectEvent.openMenu(screen.getByLabelText(label))
      expect(screen.getByText("chocolate")).toBeTruthy()
    })

    it("strips out duplicate menu entries", async () => {
      await selectEvent.openMenu(screen.getByLabelText(label))
      expect(screen.getAllByText(duplicate)).toHaveLength(1)
    })

    it("sorts entries", async () => {
      await selectEvent.openMenu(screen.getByLabelText(label))
      const chocolateElement = screen.getByText("chocolate")
      const vanillaElement = screen.getByText("vanilla")
      // compareDocumentPosition returns a bitmask, so we do a bitwise AND on the results
      expect(
        chocolateElement.compareDocumentPosition(vanillaElement) &
        Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy()
    })
  })

  describe("and a sort function is specified", () => {
    const label = "Frogs"
    const code = "632T"
    const duplicate = "duplicated"

    const transformerFunction = value => (value === code ? "Strawberry" : value)

    const compareFunction = (a, b) => {
      if (a.toLowerCase() < b.toLowerCase()) {
        return 1
      }
      if (a.toLowerCase() > b.toLowerCase()) {
        return -1
      }

      return 0
    }

    const filterer = jest.fn()
    beforeEach(() => {
      filterer.mockReset()
      mockQueryParamSearchString = undefined

      const options = [duplicate, "vanilla", "chocolate", duplicate, code]

      const products = render(
        <DropdownFilter
          displayLabel={label}
          filterer={filterer}
          options={options}
          optionTransformer={transformerFunction}
          compareFunction={compareFunction}
        />
      )

      rerender = () => products.rerender(<DropdownFilter
        displayLabel={label}
        filterer={filterer}
        options={options}
        optionTransformer={transformerFunction}
        compareFunction={compareFunction}
      />)
    })


    it("sorts entries according to the function", async () => {
      await selectEvent.openMenu(screen.getByLabelText(label))

      const chocolateElement = screen.getByText("chocolate")
      const vanillaElement = screen.getByText("vanilla")
      const strawberryElement = screen.getByText("Strawberry")

      // compareDocumentPosition returns a bitmask, so we do a bitwise AND on the results
      expect(
        chocolateElement.compareDocumentPosition(vanillaElement) &
        Node.DOCUMENT_POSITION_PRECEDING
      ).toBeTruthy()

      expect(
        strawberryElement.compareDocumentPosition(vanillaElement) &
        Node.DOCUMENT_POSITION_PRECEDING
      ).toBeTruthy()
    })
  })
})
