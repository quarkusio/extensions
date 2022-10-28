import React from "react"
import { render, screen } from "@testing-library/react"
import VersionFilter from "./version-filter"

describe("version filter", () => {
  beforeEach(() => {
    render(<VersionFilter />)
  })

  xit("renders a title", () => {
    expect(screen.getByText("Quarkus Version")).toBeTruthy()
  })
})
