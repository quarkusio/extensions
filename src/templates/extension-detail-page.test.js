import React from "react"
import { render, screen } from "@testing-library/react"
import ExtensionDetailTemplate from "./extension-detail"

describe("extension detail page", () => {
  const category = "jewellery"
  const previous = {}
  const next = {}

  const extension = {
    name: "JRuby",
    slug: "jruby-slug",
    metadata: { categories: [category] },
  }

  beforeEach(() => {
    render(
      <ExtensionDetailTemplate
        data={{ extension, previous, next }}
        location="/somewhere"
      />
    )
  })

  it("renders the extension name", () => {
    expect(screen.getByText(extension.name)).toBeTruthy()
  })

  it("renders the category", () => {
    expect(screen.getByText(category)).toBeTruthy()
  })
})
