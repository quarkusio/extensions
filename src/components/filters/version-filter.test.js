import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import VersionFilter from "./version-filter"
import selectEvent from "react-select-event"

let mockQueryParamSearchString = undefined

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

describe("version filter", () => {
  const label = "Built With"

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
      expect(screen.getByTestId("built-with-form")).toHaveFormValues({
        "built-with": "",
      })
      await fireEvent.click(screen.getByRole("combobox"))
      expect(screen.getByTestId("built-with-form")).toHaveFormValues({
        "built-with": "",
      })
    })
  })

  describe("when options are available", () => {
    const filterer = jest.fn()
    beforeEach(() => {
      filterer.mockReset()
      mockQueryParamSearchString = undefined

      render(
        <VersionFilter
          filterer={filterer}
          extensions={[
            { metadata: { builtWithQuarkusCore: "1.3duplicate" } },
            { metadata: { builtWithQuarkusCore: "1.1" } },
            { metadata: { builtWithQuarkusCore: "1.2" } },
            { metadata: { builtWithQuarkusCore: "1.3duplicate" } },
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

    it("renders menu entries", async () => {
      await selectEvent.openMenu(screen.getByLabelText(label))
      expect(screen.getByText("1.2")).toBeTruthy()
    })

    it("changes the value on click", async () => {
      expect(screen.getByTestId("built-with-form")).toHaveFormValues({
        "built-with": "",
      })
      await selectEvent.select(screen.getByLabelText(label), "1.1")
      expect(screen.getByTestId("built-with-form")).toHaveFormValues({
        "built-with": "1.1",
      })
    })

    it("sends a message on click", async () => {
      expect(screen.getByTestId("built-with-form")).toHaveFormValues({
        "built-with": "",
      })
      await selectEvent.select(screen.getByLabelText(label), "1.1")
      expect(filterer).toHaveBeenCalledWith("1.1")
    })
  })
})
