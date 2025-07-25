import * as React from "react"
import styled from "styled-components"
import { useMediaQuery } from "react-responsive"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronDown } from "@fortawesome/free-solid-svg-icons"
import { device } from "../util/styles/breakpoints"

const DesktopSubmenu = styled.ul`
  text-align: right;

  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;

  list-style: none;

  background: var(--submenu-background-color);
  color: var(--navbar-text-color);

  position: absolute;
  z-index: 1;
  top: 100%;
  min-width: 250px;

  padding: 0 0;
  transform: translateX(-100%) translateY(-30px);
  // Right align by shifting left
  // Add a buffer on top so we can move the mouse down onto the menu without falling into a 'blank' bit and closing the page

  margin-top: 58px; // How far down below the heading the menu sits - subtract the y translation from this to get the real value
`

// Used on mobile menus
const MobileSubmenu = styled.ul`
  text-align: center;
  position: relative;
  display: flex;
  overflow: hidden;

  flex-direction: column;
  flex-wrap: nowrap;

  list-style: none;

  background: var(--submenu-background-color);
  color: var(--navbar-text-color);

  width: 100%;
  top: 1rem; // The same as the padding on the entries in the parent menu
  padding: 0;
`

const FlippyIcon = styled(({ isOpen, ...props }) => (
  <FontAwesomeIcon {...props} />
))`
  transform: translateX(-1px); // To ensure alignment with parent site

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
  gap: 6px;
  justify-content: flex-end;
  align-items: center;
  padding: 0 14.4px; // Occult values to match the main site
  line-height: 1.5rem; // This contributes to the spacing between items in the dropdown
`

const Dropdown = styled.li`
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;
  position: relative;
  padding: 1rem 0;

  flex-flow: wrap;

  @media ${device.sm} {
    justify-content: center;
  }
`

// This is needed to anchor the absolute dropdown to a relative position on the header
const Anchor = styled.div`
  position: relative;
`

const NavEntry = styled(props => <li {...props} />)`
  border-bottom: 1px solid var(--submenu-separator-color);
  width: 100%;
  height: 100%;
  font-weight: var(--font-weight-bold);
  line-height: 1.8rem;
  display: flex;
  position: relative;

  &:hover {
    color: var(--navbar-text-color);
    background-color: var(--submenu-hover-color);
  }

  a {
    padding: 5px 10px;
    color: var(--navbar-text-color);
    white-space: nowrap;
    width: 100%;

    &:visited {
      color: var(--navbar-text-color);
    }

    ${({ current }) =>
            current &&
            `   
        color: var(--red);
        font-weight: var(--font-weight-awfully-bold);
          
        &:visited {
           color: var(--red);
        }
      `}
  }
`

const Submenu = ({ title, children }) => {
  const isMobile = useMediaQuery({ query: device.sm })

  const [open, setOpen] = React.useState(false)

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const toggleOpen = () => {
    setOpen(!open)
  }

  // We use css tranforms to flip the icon, but let's adjust the title for testing and screenreaders
  const iconTitle = open ? "chevronUp" : "chevronDown"


  const menu = isMobile ? (<MobileSubmenu>{children}</MobileSubmenu>) :
    (<Anchor>
      <DesktopSubmenu> {children} </DesktopSubmenu>
    </Anchor>)

  return (
    <Dropdown
      onMouseOver={handleOpen}
      onMouseOut={handleClose}
    >
      <MenuTitle onClick={toggleOpen}>
        <div>{title}</div>
        <FlippyIcon icon={faChevronDown} isOpen={open} title={iconTitle} />
      </MenuTitle>

      {open ? menu : <Anchor />}
    </Dropdown>
  )
}

export { Submenu, NavEntry }
