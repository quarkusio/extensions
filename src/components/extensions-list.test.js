import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ExtensionsList from "./extensions-list"

describe("extension list", () => {
  const category = "jewellery"
  const extensions = [
    {
      name: "JRuby",
      slug: "jruby-slug",
      metadata: { categories: [category] },
    },
  ]
  const user = userEvent.setup()

  beforeEach(() => {
    render(<ExtensionsList extensions={extensions} />)
  })

  it("renders the extension name", () => {
    expect(screen.getByText(extensions[0].name)).toBeTruthy()
  })

  it("renders the correct link", () => {
    const link = screen.getByRole("link")
    expect(link).toBeTruthy()
    // Hardcoding the host is a bit risky but this should always be true in  test environment
    expect(link.href).toBe("http://localhost/jruby-slug")
  })

  it("filters out extensions which do not match the search filter", async () => {
    const searchInput = screen.getByRole("textbox")
    await user.click(searchInput)
    await user.keyboard("octopus")
    expect(screen.queryByText(extensions[0].name)).toBeFalsy()
  })

  it("leaves in extensions which do not match the search filter", () => {
    const searchInput = screen.getByRole("textbox")
    user.type(searchInput, { target: { value: "Ruby" } })
    expect(screen.getByText(extensions[0].name)).toBeTruthy()
  })
})
