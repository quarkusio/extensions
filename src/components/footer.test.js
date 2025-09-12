import React from "react"
import { render, screen } from "@testing-library/react"
import Footer from "./footer"

describe("footer", () => {
  const supportedText = "Sponsored by"

  beforeEach(() => {
    render(<Footer />)
  })

  it("does not renders a supported by statement", () => {
    expect(screen.findByText(supportedText)).toBeTruthy()
  })

})
