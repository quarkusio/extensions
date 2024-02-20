import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Sortings from "./sortings"
import selectEvent from "react-select-event"
import { alphabeticalExtensionComparator } from "./alphabetical-extension-comparator"
import { timestampExtensionComparator } from "./timestamp-extension-comparator"


let mockQueryParamSearchString = undefined

jest.mock("react-use-query-param-string", () => {

  const original = jest.requireActual("react-use-query-param-string")
  return {
    ...original,
    useQueryParamString: jest.fn().mockImplementation(() => [mockQueryParamSearchString, jest.fn().mockImplementation((val) => mockQueryParamSearchString = val), true]),
    getQueryParams: jest.fn().mockReturnValue({ "search-regex": mockQueryParamSearchString })

  }
})

describe("sorting bar", () => {
  const sortListener = jest.fn()

  beforeEach(() => {
    mockQueryParamSearchString = undefined
    render(
      <Sortings
        sorterAction={sortListener}
      />
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })


  describe("sorting", () => {
    userEvent.setup()
    const label = "Sort by"

    it("lets the listener know when a new sort scheme is chosen", async () => {
      expect(screen.getByTestId("sort-form")).toHaveFormValues({
        "sort": "",
      })
      await selectEvent.select(screen.getByLabelText(label), "Most recently released")

      expect(sortListener).toHaveBeenCalled()
    })

    it("lets the listener know when a new timestamp sort scheme is chosen", async () => {
      expect(screen.getByTestId("sort-form")).toHaveFormValues({
        "sort": "",
      })
      await selectEvent.select(screen.getByLabelText(label), "Most recently released")

      expect(sortListener).toHaveBeenCalledWith(expect.any(Function))
      const param = sortListener.mock.calls[0][0]
      expect(param()).toEqual(timestampExtensionComparator)
    })

    it("lets the listener know when an alphabetical scheme is chosen", async () => {
      expect(screen.getByTestId("sort-form")).toHaveFormValues({
        "sort": "",
      })
      await selectEvent.select(screen.getByLabelText(label), "Alphabetical")

      expect(sortListener).toHaveBeenCalledWith(expect.any(Function))
      const param = sortListener.mock.calls[0][0]
      expect(param()).toEqual(alphabeticalExtensionComparator)
    })

  })
})
