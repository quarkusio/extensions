import React from "react"
import { render, screen } from "@testing-library/react"
import BreadcrumbBar from "./breadcrumb-bar"

describe("breadcrumb bar", () => {
  const name = "AwesomeExtension"

  beforeEach(() => {
    render(<BreadcrumbBar name={name} />)
  })

  it("renders the extension name", () => {
    expect(screen.getByText(new RegExp(name))).toBeTruthy()
  })

  it("renders a link back to the home", () => {
    const link = screen.getByText(/^Extensions/)
    expect(link).toBeTruthy()
    // Hardcoding the host is a bit risky but this should always be true in  test environment
    expect(link.href).toBe("http://localhost/")
  })
})
