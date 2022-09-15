import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import CopyToClipboard from "./copy-to-clipboard"

describe("copy to clipboard utility", () => {
  const text = "my text to copy"

  describe("on initial render", () => {
    beforeEach(() => {
      render(<CopyToClipboard>{text}</CopyToClipboard>)
    })

    it("renders the text we should be copying", () => {
      expect(screen.getByText(text)).toBeTruthy()
    })

    it("renders a button", () => {
      expect(screen.getByRole("button")).toBeTruthy()
    })

    it("renders a clipboard", () => {
      // This relies on the mock setting a class for us to inspect
      expect(screen.getByRole("button").children[0]).toHaveClass("clipboard")
    })
  })

  describe("after a click", () => {
    Object.assign(window.navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
    })

    beforeEach(() => {
      render(<CopyToClipboard>{text}</CopyToClipboard>)
      const button = screen.getByRole("button")
      fireEvent.click(button)
    })

    it("renders the text we had copied", () => {
      expect(screen.getByText(text)).toBeTruthy()
    })

    it("renders a button", () => {
      expect(screen.getByRole("button")).toBeTruthy()
    })

    it("renders clipboard", () => {
      // This relies on the mock setting a class for us to inspect
      expect(screen.getByRole("button").children[0]).toHaveClass(
        "clipboard-check"
      )
    })
  })
})
