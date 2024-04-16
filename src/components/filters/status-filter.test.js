import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import StatusFilter from "./status-filter"
import selectEvent from "react-select-event"
import { useQueryParamString } from "react-use-query-param-string"

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

describe("status filter", () => {
  const label = "Status"

  describe("when the list is empty", () => {
    beforeEach(() => {
      render(<StatusFilter />)
    })

    it("renders a title", () => {
      expect(screen.getByText(label)).toBeTruthy()
    })

    it("has a dropdown menu", () => {
      expect(screen.getByRole("combobox")).toBeTruthy()
    })

    it("gracefully does nothing on click", async () => {
      expect(screen.getByTestId("status-form")).toHaveFormValues({
        status: "",
      })
      await fireEvent.click(screen.getByRole("combobox"))
      expect(screen.getByTestId("status-form")).toHaveFormValues({
        status: "",
      })
    })
  })

  describe("when options are available", () => {
    const filterer = jest.fn()
    beforeEach(() => {
      filterer.mockReset()
      mockQueryParamSearchString = undefined

      const extensions = [
        { metadata: { status: "shinyduplicate" } },
        { metadata: { status: "sublime" } },
        { metadata: { status: "sad" } },
        { metadata: { status: "shinyduplicate" } },
      ]

      render(
        <StatusFilter
          filterer={filterer}
          extensions={extensions}
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
      expect(screen.getByText("sublime")).toBeTruthy()
    })

    it("changes the value on click", async () => {
      expect(screen.getByTestId("status-form")).toHaveFormValues({
        status: "",
      })
      await selectEvent.select(screen.getByLabelText(label), "sublime")
      expect(screen.getByTestId("status-form")).toHaveFormValues({
        status: "sublime",
      })
    })

    it("sends a message on click", async () => {
      expect(screen.getByTestId("status-form")).toHaveFormValues({
        status: "",
      })
      await selectEvent.select(screen.getByLabelText(label), "sublime")
      expect(filterer).toHaveBeenCalledWith("sublime")
    })

    it("sets search parameters", async () => {

      const [, setQueryParam] = useQueryParamString()
      expect(screen.getByTestId("status-form")).toHaveFormValues({
        status: "",
      })
      await selectEvent.select(screen.getByLabelText(label), "sublime")

      expect(setQueryParam).toHaveBeenCalledWith("sublime")
    })
  })
})
