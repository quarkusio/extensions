import React from "react"
import { render, screen } from "@testing-library/react"
import RatingFilter from "./rating-filter"

describe("rating filter", () => {
  beforeEach(() => {
    render(<RatingFilter />)
  })

  xit("renders categories", () => {
    expect(screen.getByText("Categories")).toBeTruthy()
  })
})
