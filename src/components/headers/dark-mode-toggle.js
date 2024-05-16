import * as React from "react"
import styled from "styled-components"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCog, faMoon, faSun } from "@fortawesome/free-solid-svg-icons"
import { getDisplayModeFromLocalStorageNoDefault, setDisplayMode } from "../util/dark-mode-helper"

const ModeIcon = styled(({ ...props }) => <FontAwesomeIcon {...props} />)`
  padding-left: 0;
  display: inline-block;
  width: 1em;
`

const Toggle = styled.li`
  display: block;
  padding: 16px 15px;
  padding-left: 10px; /* hacky override to match spacing (more or less) to parent site */
`

const modes = [{
  alt: "sun",
  icon: faSun,
  theme: "light",
  title: "'light': 'Color scheme: light; next: dark"
}, {
  alt: "moon",
  icon: faMoon,
  theme: "dark",
  title: "'dark': 'Color scheme: dark; next: system preferences"
},
  {
    alt: "cog",
    icon: faCog,
    theme: "system",
    title: "'system': 'Color scheme: system preferences; next: light'"
  }]

const DarkModeToggle = () => {

  const startMode = getDisplayModeFromLocalStorageNoDefault()
  const startIndex = startMode ? modes.findIndex(e => e.theme === startMode) : 0

  const [modeIndex, setModeIndex] = React.useState(startIndex)
  const mode = modes[modeIndex]

  const toggleMode = () => {
    const newIndex = (modeIndex + 1) % modes.length
    const newTheme = modes[newIndex].theme
    setDisplayMode(newTheme)

    setModeIndex(newIndex)
  }


  return (
    <Toggle title={mode.title}
            onClick={toggleMode}
    >
      <ModeIcon aria-label={mode.theme} icon={mode.icon} color="var(--navbar-text-color)" title={mode.alt} />
    </Toggle>
  )
}

export { DarkModeToggle }
