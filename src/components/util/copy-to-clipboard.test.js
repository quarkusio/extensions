import React from "react"
import { render, screen } from "@testing-library/react"
import CopyToClipboard from "./copy-to-clipboard"

describe("copy to clipboard utility", () => {
  const text = "my text to copy"
  beforeEach(() => {
    render(<CopyToClipboard>{text}</CopyToClipboard>)
  })

  it("renders the text we should be copying", () => {
    expect(screen.getByText(text)).toBeTruthy()
  })

  it("renders a button", () => {
    expect(screen.getByRole("button")).toBeTruthy()
  })

  it("renders clipboard", () => {
    // This relies on the mock setting a class for us to inspect
    expect(screen.getByRole("button").children[0]).toHaveClass("clipboard")
  })
})
