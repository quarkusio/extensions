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

const downloadsLabel = "Downloads"

describe("sorting bar", () => {
  const sortListener = jest.fn()
  userEvent.setup()
  const label = "Sort by"


  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("when download data is available", () => {

    const dataDescription = /January 2024/

    beforeEach(() => {
      mockQueryParamSearchString = undefined
      render(
        <Sortings
          sorterAction={sortListener} downloadData={{ date: 1704067200000 }}
        />
      )
    })


    it("includes the Downloads sort option", async () => {
      await selectEvent.openMenu(screen.getByLabelText(label))
      expect(screen.getByText(downloadsLabel)).toBeInTheDocument()
      await selectEvent.select(screen.getByLabelText(label), downloadsLabel)
    })

    it("does not mention anything about the download date by default", async () => {
      expect(screen.queryByText(dataDescription)).not.toBeInTheDocument()
    })

    it("explains the download date when the download option is selected", async () => {
      await selectEvent.select(screen.getByLabelText(label), downloadsLabel)
      expect(screen.queryByText(dataDescription)).toBeInTheDocument()
    })

    it("removes the data descriptor when another option is selected", async () => {
      await selectEvent.select(screen.getByLabelText(label), downloadsLabel)
      expect(screen.queryByText(dataDescription)).toBeInTheDocument()

      await selectEvent.select(screen.getByLabelText(label), "Most recently released")
      expect(screen.queryByText(dataDescription)).not.toBeInTheDocument()
    })

  })

  describe("when download data is not available", () => {

    beforeEach(() => {
      mockQueryParamSearchString = undefined
      render(
        <Sortings
          sorterAction={sortListener}
        />
      )
    })


    it("does not includes the Downloads sort option", async () => {
      await selectEvent.openMenu(screen.getByLabelText(label))

      expect(screen.queryByText(downloadsLabel)).not.toBeInTheDocument()
    })

  })

  describe("sorting", () => {

    beforeEach(() => {
      mockQueryParamSearchString = undefined
      render(
        <Sortings
          sorterAction={sortListener} downloadData={{ date: 170 }}
        />
      )
    })


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
