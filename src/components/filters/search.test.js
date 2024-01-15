import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import Search from "./search"

let mockQueryParamSearchString = undefined

jest.mock("react-use-query-param-string", () => {

  const original = jest.requireActual("react-use-query-param-string")
  return {
    ...original,
    useQueryParamString: jest.fn().mockImplementation(() => [mockQueryParamSearchString, jest.fn().mockImplementation((val) => mockQueryParamSearchString = val), true]),
    getQueryParams: jest.fn().mockReturnValue({ "search-regex": mockQueryParamSearchString })

  }
})

describe("search", () => {
  const searcher = jest.fn(() => {
  })

  afterEach(() => {
    jest.clearAllMocks()
  })


  describe("on a normal render", () => {
    beforeEach(() => {
      render(<Search searcher={searcher} />)
    })
    it("renders a search form", () => {
      expect(screen.getByPlaceholderText("Find an extension")).toBeTruthy()
    })

    it("starts with a blank value", () => {
      const searchInput = screen.getByPlaceholderText("Find an extension")

      expect(searchInput.value).toBe("")
    })

    it("passes through the search expression to the listener", () => {
      const searchInput = screen.getByPlaceholderText("Find an extension")

      fireEvent.change(searchInput, { target: { value: "test" } })

      expect(searcher).toHaveBeenLastCalledWith("test")
      expect(searchInput.value).toBe("test")
    })
  })

  describe("when query parameters are set", () => {
    beforeEach(() => {
      mockQueryParamSearchString = "awesome"
      render(<Search searcher={searcher} />)
    })

    it("reads the url query parameter string", () => {
      const searchInput = screen.getByPlaceholderText("Find an extension")
      expect(searchInput.value).toBe("awesome")
    })

    it("calls the searcher", () => {
      screen.getByPlaceholderText("Find an extension")

      // No event, but the presence of query params should count as an event
      expect(searcher).toHaveBeenCalledWith("awesome")
    })

    it("passes through updated search expression to the listener", () => {
      const searchInput = screen.getByPlaceholderText("Find an extension")

      fireEvent.change(searchInput, { target: { value: "new information" } })

      expect(searcher).toHaveBeenLastCalledWith("new information")
      expect(searchInput.value).toBe("new information")
    })
  })

})
