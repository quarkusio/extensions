import React from "react"
// eslint-disable-next-line jest/no-mocks-import
import "../../../__mocks__/match-media"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DarkModeToggle } from "./dark-mode-toggle"

describe("dark mode toggle", () => {

  const sunIconTitle = "sun"
  const moonIconTitle = "moon"
  const cogIconTitle = "cog"


  let user
  beforeEach(() => {
    user = userEvent.setup()
    render(
      <DarkModeToggle />
    )
  })


  it("renders a dark light mode icon", () => {
    expect(screen.getByTitle(sunIconTitle)).toBeInTheDocument()
  })

  it("shows the menu as light before any click", async () => {
    expect(screen.getByTitle(sunIconTitle)).toBeInTheDocument()
  })

  it("clicking on the menu flips the icon", async () => {
    await user.click(screen.getByTitle(sunIconTitle))
    expect(screen.getByTitle(moonIconTitle)).toBeInTheDocument()

    await user.click(screen.getByTitle(moonIconTitle))
    expect(screen.getByTitle(cogIconTitle)).toBeInTheDocument()

    await user.click(screen.getByTitle(cogIconTitle))
    expect(screen.getByTitle(sunIconTitle)).toBeInTheDocument()
  })

  it("updates local storage", async () => {
    await user.click(screen.getByTitle(sunIconTitle))
    expect(localStorage.getItem("color-theme")).toBe("dark")

    await user.click(screen.getByTitle(moonIconTitle))
    expect(localStorage.getItem("color-theme")).toBe("system")

    await user.click(screen.getByTitle(cogIconTitle))
    expect(localStorage.getItem("color-theme")).toBe("light")
  })

  it("updates document classes", async () => {
    expect(document.documentElement.classList.value).toBe("")
    expect(document.documentElement.classList.length).toBe(0)

    await user.click(screen.getByTitle(sunIconTitle))
    expect(document.documentElement.classList.item(0)).toBe("dark")

    await user.click(screen.getByTitle(moonIconTitle))
    // Our mock media preference is set to light mode
    expect(document.documentElement.classList.length).toBe(0)

    await user.click(screen.getByTitle(cogIconTitle))
    expect(document.documentElement.classList.value).toBe("")
    expect(document.documentElement.classList.length).toBe(0)

  })
})

