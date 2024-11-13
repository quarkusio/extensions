import React from "react"
import { render, screen } from "@testing-library/react"
import { Context as ResponsiveContext } from "react-responsive"
import userEvent from "@testing-library/user-event"
import { FilterSubmenu } from "./filter-submenu"

describe("filter hover flippy menu", () => {
  const linkTitle = "Open Me"
  const listItem = "list item"
  const dummyElement = "dummy element" // to give us somewhere else to hover over
  const menuOpen = "chevronUp"
  const menuClosed = "chevronDown"

  describe("at a mobile screen size", () => {
    let user
    beforeEach(() => {
      user = userEvent.setup({ skipHover: true })
      render(
        <ResponsiveContext.Provider value={{ width: 300 }}>
          <div>{dummyElement}</div>
          <FilterSubmenu title={linkTitle}>
            <li>{listItem}</li>
          </FilterSubmenu>
        </ResponsiveContext.Provider>
      )
    })

    it("shows the title", () => {
      expect(screen.getByText(linkTitle)).toBeInTheDocument()
    })

    it("does not show the contents", () => {
      expect(screen.queryByText(listItem)).toBeFalsy()
    })

    it("shows the menu as closed before any click", async () => {
      expect(screen.queryByTitle(menuOpen)).toBeNull()
      expect(screen.getByTitle(menuClosed)).toBeInTheDocument()
    })

    it("clicking on the menu flips the icon", async () => {
      await user.click(screen.getByText(linkTitle))

      expect(screen.getByTitle(menuOpen)).toBeInTheDocument()
      expect(screen.queryByTitle(menuClosed)).toBeNull()
    })

    it("clicking on the menu brings up a dropdown and shows the contents", async () => {
      await user.click(screen.getByText(linkTitle))
      expect(screen.getByText(listItem)).toBeTruthy()
    })

    it("clicking the twisty closes the menu and flips the icon", async () => {
      await user.click(screen.getByText(linkTitle))
      expect(screen.queryByTitle(menuClosed)).toBeNull()
      expect(screen.getByTitle(menuOpen)).toBeInTheDocument()

      await user.click(screen.getByText(linkTitle))

      expect(screen.queryByTitle(menuOpen)).toBeNull()
      expect(screen.getByTitle(menuClosed)).toBeInTheDocument()
    })

    it("clicking elsewhere closes the menu and flips the icon", async () => {
      await user.click(screen.getByText(linkTitle))
      expect(screen.queryByTitle(menuClosed)).toBeNull()
      expect(screen.getByTitle(menuOpen)).toBeInTheDocument()

      await user.click(screen.getByText(listItem))

      expect(screen.queryByTitle(menuClosed)).toBeNull()
      expect(screen.getByTitle(menuOpen)).toBeInTheDocument()
    })

    it("clicking on the contents of an open menu does not close it", async () => {
      await user.click(screen.getByText(linkTitle))
      expect(screen.queryByTitle(menuClosed)).toBeNull()
      expect(screen.getByTitle(menuOpen)).toBeInTheDocument()

      await user.click(screen.getByText(dummyElement))

      // Should still be open
      expect(screen.queryByTitle(menuClosed)).toBeNull()
      expect(screen.getByTitle(menuOpen)).toBeInTheDocument()
    })
  })

})
