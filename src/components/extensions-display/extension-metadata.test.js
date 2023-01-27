import React from "react"
import { render, screen } from "@testing-library/react"
import ExtensionMetadata from "./extension-metadata"

describe("extension metadata block", () => {
  const category = "socks"
  const maturity = "elderly"
  const issues = "42"
  const otherCategory = "mittens"
  const thing = "something"

  const metadata = {
    categories: [category, otherCategory],
    something: [thing],
    empty: [],
    maturity,
    issues: issues,
  }

  describe("for a simple field", () => {
    const displayName = "Maturity"
    const pluralName = "Maturities" // This makes no sense and should not be shown, but let's confirm it doesn't get shown!

    beforeEach(() => {
      render(
        <ExtensionMetadata
          data={{ name: displayName, plural: pluralName, metadata }}
        />
      )
    })

    it("renders the field name", () => {
      expect(screen.getByText(displayName)).toBeTruthy()
      expect(screen.queryByText(pluralName)).toBeFalsy()
    })

    it("renders the content", () => {
      expect(screen.getByText(maturity)).toBeTruthy()
    })

    it("does not renders other field names", () => {
      expect(screen.queryByText(issues)).toBeNull()
    })
  })

  describe("for a field with missing data", () => {
    const displayName = "Does not exist"
    const pluralName = "Still does not exist"

    beforeEach(() => {
      render(
        <ExtensionMetadata
          data={{ name: displayName, plural: pluralName, metadata }}
        />
      )
    })

    it("does not render the field name", () => {
      expect(screen.queryByText(displayName)).toBeNull()
      expect(screen.queryByText(pluralName)).toBeNull()
    })

    it("does not render anything at all", () => {
      // Look for any text
      expect(screen.queryAllByText(/./)).toHaveLength(0)
    })
  })

  describe("for link", () => {
    const displayName = "Category"
    const text = "some text"
    const url = "http://thing"

    describe("in the simple case", () => {
      beforeEach(() => {
        render(
          <ExtensionMetadata
            data={{
              name: displayName,
              text,
              url,
            }}
          />
        )
      })

      it("renders the field name", () => {
        expect(screen.getByText(displayName)).toBeTruthy()
      })

      it("renders the link title", () => {
        expect(screen.getByText(text)).toBeTruthy()
      })

      it("renders the link", () => {
        expect(screen.getByRole("link")).toHaveAttribute("href", url)
      })
    })
  })

  describe("for an array field", () => {
    const displayName = "Category"
    const fieldName = "categories"

    describe("in the simple case", () => {
      beforeEach(() => {
        render(
          <ExtensionMetadata
            data={{
              name: displayName,
              fieldName,
              metadata,
            }}
          />
        )
      })

      it("renders the field name", () => {
        expect(screen.getByText(displayName)).toBeTruthy()
      })

      it("renders the first element of the content", () => {
        expect(screen.getByText(category)).toBeTruthy()
      })

      it("also renders other elements in the content", () => {
        expect(screen.getByText(otherCategory)).toBeTruthy()
      })

      it("does not render other field names", () => {
        expect(screen.queryByText(issues)).toBeNull()
      })
    })

    describe("with a transformer", () => {
      const frogs = "frogs"

      beforeEach(() => {
        render(
          <ExtensionMetadata
            data={{
              name: displayName,
              fieldName,
              metadata,
              transformer: () => frogs,
            }}
          />
        )
      })

      it("renders the field name", () => {
        expect(screen.getByText(displayName)).toBeTruthy()
      })

      it("renders the first element of the content", () => {
        expect(screen.getAllByText(frogs)).toHaveLength(2)
      })
    })

    describe("with an empty array", () => {
      const displayName = "Empty"

      beforeEach(() => {
        render(<ExtensionMetadata data={{ name: displayName, metadata }} />)
      })

      it("does not render the field name", () => {
        expect(screen.queryByText(displayName)).toBeNull()
      })

      it("does not render anything at all", () => {
        // Look for any text
        expect(screen.queryAllByText(/./)).toHaveLength(0)
      })
    })

    describe("with a nulling transformer", () => {
      const displayName = "Category"
      const plural = "Categories"
      const fieldName = "categories"

      beforeEach(() => {
        render(
          <ExtensionMetadata
            data={{
              name: displayName,
              fieldName,
              plural,
              transformer: () => null,
              metadata,
            }}
          />
        )
      })

      it("does not render the field name", () => {
        expect(screen.queryByText(displayName)).toBeNull()
        expect(screen.queryByText(plural)).toBeNull()
      })

      it("does not render anything at all", () => {
        // Look for any text
        expect(screen.queryAllByText(/./)).toHaveLength(0)
      })
    })
  })

  describe("for a display name which should be conditionally shown as a plural", () => {
    const displayName = "Category"
    const pluralName = "Categories"

    describe("when there are several elements in the list", () => {
      const fieldName = "categories"

      beforeEach(() => {
        render(
          <ExtensionMetadata
            data={{
              name: displayName,
              plural: pluralName,
              fieldName,
              metadata,
            }}
          />
        )
      })

      it("renders the plural name", () => {
        expect(screen.queryByText(displayName)).toBeFalsy()
        expect(screen.queryByText(pluralName)).toBeTruthy()
      })
    })

    describe("when there is only one element in the list", () => {
      const fieldName = "something"

      beforeEach(() => {
        render(
          <ExtensionMetadata
            data={{
              name: displayName,
              plural: pluralName,
              fieldName,
              metadata,
            }}
          />
        )
      })

      it("renders the singular name", () => {
        expect(screen.queryByText(displayName)).toBeTruthy()
        expect(screen.queryByText(pluralName)).toBeFalsy()
      })
    })
  })
})
