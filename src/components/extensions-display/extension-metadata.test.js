import React from "react"
import { render, screen } from "@testing-library/react"
import ExtensionMetadata from "./extension-metadata"

describe("extension metadata block", () => {
  const category = "socks"
  const maturity = "elderly"
  const issues = "42"
  const otherCategory = "mittens"

  const metadata = {
    categories: [category, otherCategory],
    maturity,
    issues: issues,
  }

  describe("for a simple field", () => {
    const displayName = "Maturity"

    beforeEach(() => {
      render(<ExtensionMetadata data={{ name: displayName, metadata }} />)
    })

    it("renders the field name", () => {
      expect(screen.getByText(displayName)).toBeTruthy()
    })

    it("renders the content", () => {
      expect(screen.getByText(maturity)).toBeTruthy()
    })

    it("also renders other field names", () => {
      expect(screen.queryByText(issues)).toBeNull()
    })
  })

  describe("for an array field", () => {
    const displayName = "Category"
    const fieldName = "categories"

    beforeEach(() => {
      render(
        <ExtensionMetadata data={{ name: displayName, fieldName, metadata }} />
      )
    })

    it("renders the field name", () => {
      expect(screen.getByText(displayName)).toBeTruthy()
    })

    it("renders the first element of the content", () => {
      expect(screen.getByText(category)).toBeTruthy()
    })

    it("also renders other field names", () => {
      expect(screen.getByText(otherCategory)).toBeTruthy()
    })

    it("does not render other field names", () => {
      expect(screen.queryByText(issues)).toBeNull()
    })
  })
})
