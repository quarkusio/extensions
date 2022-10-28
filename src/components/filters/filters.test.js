import React from "react"
import { render, screen } from "@testing-library/react"
import Filters from "./filters"

describe("filters bar", () => {
  beforeEach(() => {
    render(<Filters />)
  })

  xit("renders categories", () => {
    expect(screen.getByText("Categories")).toBeTruthy()
  })
})
