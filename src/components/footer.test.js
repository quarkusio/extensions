import React from "react"
import { render, screen } from "@testing-library/react"
import Footer from "./footer"

describe("footer", () => {
  const supportedText = "Sponsored by"

  beforeEach(() => {
    render(<Footer />)
  })

  it("renders a supported by statement", () => {
    expect(screen.getByText(supportedText)).toBeTruthy()
  })

  it("renders a creative commons attribution", () => {
    expect(screen.getByText("CC by 3.0")).toBeTruthy()
  })
})
