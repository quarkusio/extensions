import * as React from "react"
import styled from "styled-components"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronDown } from "@fortawesome/free-solid-svg-icons"
import { device } from "../util/styles/breakpoints"

export const Element = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;

  // noinspection CssUnknownProperty
  @media ${device.sm} {
    width: 100%;
    justify-content: space-between
  }
`

export const Entry = styled.li`
  font-size: var(--font-size-16);
  color: var(--main-text-color);
  display: flex;
  padding: 0;
  gap: 8px;

  // noinspection CssUnknownProperty
  @media ${device.sm} {
    padding-left: var(--mobile-filter-margins);
    line-height: 1.8rem;
    border-top: 1px solid var(--filter-separator-color);
  }
`

export const Entries = styled.ul`
  list-style: none;
  width: 100%;
  line-height: 23px;
  margin-top: 0;
  padding-left: var(--a-small-space);

  // noinspection CssUnknownProperty
  @media ${device.sm} {
    padding-left: 0;
  }
`

const MobileSubmenu = styled.form`
  position: relative;
  display: flex;
  overflow: hidden;

  flex-direction: column;
  flex-wrap: nowrap;

  list-style: none;
  width: 100%;
  padding: 0;
  margin: 0;
  line-height: 1.5rem; // This contributes to the spacing between items in the dropdown
  background-color: var(--main-background-color);
`

const FlippyIcon = styled(({ isOpen, ...props }) => (
  <FontAwesomeIcon {...props} />
))`
  ${({ isOpen }) =>
          isOpen &&
          ` 
    transition: 0.2s;
    transform: rotateX(180deg);
    `}
`

const MenuTitle = styled.div`
  display: flex;
  flex-direction: row;
  gap: 3.8px;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
  padding: calc(var(--mobile-filter-margins) / 2) var(--mobile-filter-margins);

  border-top: 1px solid var(--filter-outline-color);

  // noinspection CssUnknownProperty
  @media ${device.sm} {
    text-transform: uppercase;
    justify-content: space-between;
    font-weight: var(--font-weight-awfully-bold);
    font-size: var(--font-size-12)
  }
`

const Dropdown = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;

  flex-flow: wrap;
  align-items: center;
  align-content: center;

  padding: 0 0;

  font-size: var(--font-size-14)
`

// This component is mobile-only
const FilterSubmenu = ({ title, children }) => {
  const [open, setOpen] = React.useState(false)

  const toggleOpen = () => {
    setOpen(!open)
  }

  // We use css tranforms to flip the icon, but let's adjust the title for testing and screenreaders
  const iconTitle = open ? "chevronUp" : "chevronDown"

  const menu = <MobileSubmenu>{children}</MobileSubmenu>

  const label = title
    ? title.toLowerCase().replace(" ", "-")
    : "unknown"


  return (
    <Dropdown>
      <MenuTitle data-testid={label + "-twisty"} onClick={toggleOpen}>
        <label>{title}</label>
        <FlippyIcon icon={faChevronDown} isOpen={open} title={iconTitle} />
      </MenuTitle>

      {open && menu}
    </Dropdown>
  )
}

export { FilterSubmenu }
