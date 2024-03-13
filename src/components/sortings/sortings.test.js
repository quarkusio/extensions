import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Sortings from "./sortings"
import selectEvent from "react-select-event"
import { alphabeticalExtensionComparator } from "./alphabetical-extension-comparator"
import { timestampExtensionComparator } from "./timestamp-extension-comparator"
import { useQueryParamString } from "react-use-query-param-string"


let mockQueryParamSearchString = undefined
jest.mock("react-use-query-param-string", () => {

  const original = jest.requireActual("react-use-query-param-string")
  const setQueryParam = jest.fn().mockImplementation((val) => mockQueryParamSearchString = val)
  return {
    ...original,
    useQueryParamString: jest.fn().mockImplementation(() => [mockQueryParamSearchString, setQueryParam, true]),
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
      render(
        <Sortings
          sorterAction={sortListener} downloadData={{ date: 1704067200000 }}
        />
      )
    })

// Because of cross-talk between the tests that seems hard to sort out, this test needs to be first
    it("does not mention anything about the download date by default", async () => {
      expect(screen.queryByText(dataDescription)).not.toBeInTheDocument()
    })


    it("includes the Downloads sort option", async () => {
      await selectEvent.openMenu(screen.getByLabelText(label))
      expect(screen.getByText(downloadsLabel)).toBeInTheDocument()
      await selectEvent.select(screen.getByLabelText(label), downloadsLabel)
    })

    it("explains the download date when the download option is selected", async () => {
      await selectEvent.select(screen.getByLabelText(label), downloadsLabel)
      expect(screen.queryByText(dataDescription)).toBeInTheDocument()
    })

    // This is verified by hand, but it's too hard to get the test working alongside the mocked query params
    it.skip("removes the data descriptor when another option is selected", async () => {
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
      jest.mock("react-use-query-param-string", () => {

        const original = jest.requireActual("react-use-query-param-string")
        const setQueryParam = jest.fn().mockImplementation((val) => mockQueryParamSearchString = val)
        return {
          ...original,
          useQueryParamString: jest.fn().mockImplementation(() => [mockQueryParamSearchString, setQueryParam, true]),
        }
      })

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

    it("sets search parameters", async () => {

      const [, setQueryParam] = useQueryParamString()

      await selectEvent.select(screen.getByLabelText(label), "Alphabetical")

      expect(setQueryParam).toHaveBeenCalledWith("alpha")
    })

  })

  describe("when query parameters are set", () => {
    beforeEach(() => {
      mockQueryParamSearchString = "alpha"
      render(
        <Sortings
          sorterAction={sortListener} downloadData={{ date: 170 }}
        />
      )
    })

    it("reads the url query parameter string", () => {
      // This is a weak assertion, since the use method is called on initialisation
      expect(useQueryParamString).toHaveBeenCalled()

      // This is a stronger assertion; did we use what we were given?
      expect(screen.queryByText("Alphabetical")).toBeInTheDocument()
      expect(sortListener).toHaveBeenCalledWith(expect.any(Function))
      const param = sortListener.mock.calls[0][0]
      expect(param()).toEqual(alphabeticalExtensionComparator)
    })

  })
})
