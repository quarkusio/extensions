import React from "react"
import { render, screen } from "@testing-library/react"
import { Context as ResponsiveContext } from "react-responsive"
import userEvent from "@testing-library/user-event"
import { Submenu } from "./submenu"

describe("hover flippy menu", () => {
  const linkTitle = "Open Me"
  const listItem = "list item"
  const dummyElement = "dummy element" // to give us somewhere else to hover over
  const menuOpen = "chevronUp"
  const menuClosed = "chevronDown"

  describe("at normal screen size", () => {
    let user
    beforeEach(() => {
      user = userEvent.setup()
      render(
        <>
          <div>{dummyElement}</div>
          <Submenu title={linkTitle}>
            <li>{listItem}</li>
          </Submenu>
        </>
      )
    })

    it("shows the title", () => {
      expect(screen.getByText(linkTitle)).toBeInTheDocument()
    })

    it("does not show the contents", () => {
      expect(screen.queryByText(listItem)).toBeFalsy()
    })

    it("shows the menu as closed before any hover", async () => {
      expect(screen.queryByTitle(menuOpen)).toBeNull()
      expect(screen.getByTitle(menuClosed)).toBeInTheDocument()
    })

    it("hovering on the menu flips the icon", async () => {
      await user.hover(screen.getByText(linkTitle))

      expect(screen.getByTitle(menuOpen)).toBeInTheDocument()
      expect(screen.queryByTitle(menuClosed)).toBeNull()
    })

    it("hovering on the menu brings up a dropdown and shows the contents", async () => {
      await user.hover(screen.getByText(linkTitle))
      expect(screen.getByText(listItem)).toBeTruthy()
    })

    it("leaving the menu after hovering flips the icon", async () => {
      await user.hover(screen.getByText(linkTitle))
      expect(screen.queryByTitle(menuClosed)).toBeNull()
      expect(screen.getByTitle(menuOpen)).toBeInTheDocument()

      await user.hover(screen.getByText(dummyElement))

      expect(screen.queryByTitle(menuOpen)).toBeNull()
      expect(screen.getByTitle(menuClosed)).toBeInTheDocument()
    })
  })

  describe("at a mobile screen size", () => {
    let user
    beforeEach(() => {
      user = userEvent.setup()
      render(
        <ResponsiveContext.Provider value={{ width: 300 }}>
          <>
            <div>{dummyElement}</div>
            <Submenu title={linkTitle}>
              <li>{listItem}</li>
            </Submenu>
          </>
        </ResponsiveContext.Provider>
      )
    })

    it("shows the title", () => {
      expect(screen.getByText(linkTitle)).toBeInTheDocument()
    })

    it("does not show the contents", () => {
      expect(screen.queryByText(listItem)).toBeFalsy()
    })

    it("shows the menu as closed before any hover", async () => {
      expect(screen.queryByTitle(menuOpen)).toBeNull()
      expect(screen.getByTitle(menuClosed)).toBeInTheDocument()
    })

    it("hovering on the menu flips the icon", async () => {
      await user.hover(screen.getByText(linkTitle))

      expect(screen.getByTitle(menuOpen)).toBeInTheDocument()
      expect(screen.queryByTitle(menuClosed)).toBeNull()
    })

    it("hovering on the menu brings up a dropdown and shows the contents", async () => {
      await user.hover(screen.getByText(linkTitle))
      expect(screen.getByText(listItem)).toBeTruthy()
    })

    it("leaving the menu after hovering flips the icon", async () => {
      await user.hover(screen.getByText(linkTitle))
      expect(screen.queryByTitle(menuClosed)).toBeNull()
      expect(screen.getByTitle(menuOpen)).toBeInTheDocument()

      await user.hover(screen.getByText(dummyElement))

      expect(screen.queryByTitle(menuOpen)).toBeNull()
      expect(screen.getByTitle(menuClosed)).toBeInTheDocument()
    })
  })

  describe("with a complicated title, rather than plain text", () => {
    let user
    const elementTitle = "an element title"
    const titleElement = <div>{elementTitle}</div>

    beforeEach(() => {
      user = userEvent.setup()
      render(
        <>
          <div>{dummyElement}</div>
          <Submenu title={titleElement}>
            <li>{listItem}</li>
          </Submenu>
        </>
      )
    })

    it("shows the title", () => {
      expect(screen.getByText(elementTitle)).toBeInTheDocument()
    })

    it("does not show the contents", () => {
      expect(screen.queryByText(listItem)).toBeFalsy()
    })

    it("hovering on the menu brings up a dropdown and shows the contents", async () => {
      await user.hover(screen.getByText(elementTitle))
      expect(screen.getByText(listItem)).toBeTruthy()
    })

    it("leaving the menu after hovering flips the icon", async () => {
      await user.hover(screen.getByText(elementTitle))
      expect(screen.queryByTitle(menuClosed)).toBeNull()
      expect(screen.getByTitle(menuOpen)).toBeInTheDocument()
    })
  })
})
