import * as React from "react"
import styled from "styled-components"
import { useMediaQuery } from "react-responsive"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronDown } from "@fortawesome/free-solid-svg-icons"

const DesktopSubmenu = styled.ul`
  text-align: right;

  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;

  list-style: none;

  background: var(--grey-3);

  position: absolute;
  z-index: 1;
  top: 100%;
  min-width: 250px;

  padding: 0 0;
  transform: translateX(-100%); // Right align by shifting left

  margin-top: 1.6em; // How far down below the heading the menu sits
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

  background: var(--grey-3);

  width: 100%;
  top: 1rem; // The same as the padding on the entries in the parent menu
  padding: 0;
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
  gap: 5px;
  justify-content: flex-end;
  align-items: center;
  padding: 0 15px;
`

const Dropdown = styled.li`
  display: flex;
  flex-direction: column;
  align-items: center;
  align-content: center;
  position: relative;
  padding: 15px 0;
  line-height: 1.8rem; // This affects the height of the elements

  ${({ isMobile }) =>
    isMobile
      ? `
        flex-wrap: nowrap;
      `
      : `  
      flex-flow: wrap;
      `}
`

// This is needed to anchor the absolute dropdown to a relative position on the header
const Anchor = styled.div`
  position: relative;
`

const NavEntry = styled(props => <li {...props} />)`
  border-bottom: 1px solid var(--grey-2);
  width: 100%;
  height: 100%;
  font-weight: var(--font-weight-bold);
  line-height: 1.8rem;
  display: flex;
  position: relative;

  &:hover {
    color: var(--white);
    background-color: var(--quarkus-blue);
  }

  a {
    padding: 5px 10px;
    color: var(--white);
    white-space: nowrap;
    width: 100%;

    &:visited {
      color: var(--white);
    }

    ${({ current }) =>
      current &&
      `   
        color: var(--red);
        font-weight: var(--font-weight-boldest);
          
        &:visited {
           color: var(--red);
        }
      `}
  }
`

const Submenu = ({ title, children }) => {
  const isMobile = useMediaQuery({ query: "(max-width: 1024px)" })

  const [open, setOpen] = React.useState(false)

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  // We use css tranforms to flip the icon, but let's adjust the title for testing and screenreaders
  const iconTitle = open ? "chevronUp" : "chevronDown"

  const mobileSubmenu = <MobileSubmenu>{children}</MobileSubmenu>

  const desktopSubmenu = (
    <Anchor>
      <DesktopSubmenu> {children} </DesktopSubmenu>
    </Anchor>
  )
  const menu = isMobile ? mobileSubmenu : desktopSubmenu

  return (
    <Dropdown
      isMobile={isMobile}
      onMouseOver={handleOpen}
      onMouseOut={handleClose}
    >
      <MenuTitle>
        <div>{title}</div>
        <FlippyIcon icon={faChevronDown} isOpen={open} title={iconTitle} />
      </MenuTitle>

      {open ? menu : <Anchor />}
    </Dropdown>
  )
}

export { Submenu, NavEntry }
