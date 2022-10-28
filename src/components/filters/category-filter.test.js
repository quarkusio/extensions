import React from "react"
import { render, screen } from "@testing-library/react"
import CategoryFilter from "./category-filter"

describe("category filter", () => {
  beforeEach(() => {
    render(<CategoryFilter />)
  })

  xit("renders categories", () => {
    expect(screen.getByText("Categories")).toBeTruthy()
  })
})
