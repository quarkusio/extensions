import React from "react"
import { render, screen } from "@testing-library/react"
import TitleBand from "./title-band"

describe("hero bar", () => {
  const arbitraryTitle = "Welcome to the Best Test in the West"

  beforeEach(() => {
    render(<TitleBand title={arbitraryTitle} />)
  })

  it("renders a welcome message", () => {
    expect(screen.getByText(arbitraryTitle)).toBeTruthy()
  })
})
