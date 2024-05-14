import React from "react"
import { render, screen } from "@testing-library/react"
import { Context as ResponsiveContext } from "react-responsive"
import Navigation from "./navigation"
import userEvent from "@testing-library/user-event"

const barsIconTitle = "bars"
const globeIconTitle = "globe"
const sunIconTitle = "sun"

describe("navigation bar", () => {
  const linkTitle = "Community"

  describe("at normal screen size", () => {
    beforeEach(() => {
      render(<Navigation />)
    })

    it("renders a navigation link", () => {
      expect(screen.getByText(linkTitle)).toBeTruthy()
    })

    it("renders links", () => {
      const link = screen.getAllByRole("link")
      expect(link).toBeTruthy()
    })

    it("renders a globe icon", () => {
      expect(screen.getByTitle(globeIconTitle)).toBeInTheDocument()
    })

    it("renders a dark light mode icon", () => {
      expect(screen.getByTitle(sunIconTitle)).toBeInTheDocument()
    })

    it("does not render a hamburger menu", () => {
      expect(screen.queryByTitle(barsIconTitle)).toBeNull()
    })
  })

  describe("at a mobile screen size", () => {
    let user
    beforeEach(() => {
      user = userEvent.setup()
      render(
        <ResponsiveContext.Provider value={{ width: 300 }}>
          <Navigation />
        </ResponsiveContext.Provider>
      )
    })

    it("does not render a navigation link", () => {
      expect(screen.queryByText(linkTitle)).toBeNull()
    })

    it("renders a hamburger menu", () => {
      expect(screen.getByTitle(barsIconTitle)).toBeTruthy()
    })

    it("clicking on the menu brings up a dropdown", async () => {
      await user.click(screen.getByTitle(barsIconTitle))
      expect(screen.getByText(linkTitle)).toBeTruthy()
    })
  })
})
