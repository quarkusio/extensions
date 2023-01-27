import React from "react"
import { render, screen } from "@testing-library/react"
import HeroBar from "./hero-bar"

describe("hero bar", () => {
  const arbitraryTitle = "Welcome to the Best Test in the West"

  beforeEach(() => {
    render(<HeroBar title={arbitraryTitle} />)
  })

  it("renders a welcome message", () => {
    expect(screen.getByText(arbitraryTitle)).toBeTruthy()
  })
})
