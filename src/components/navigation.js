import * as React from "react"
import { Link } from "gatsby"
import { StaticImage } from "gatsby-plugin-image"
import styled from "styled-components"
import { useMediaQuery } from "react-responsive"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBars } from "@fortawesome/free-solid-svg-icons"

const NavToggle = styled.label`
  font-size: 27.2px;
`

const NavBar = styled.nav`
  background-color: var(--black);
  color: var(--white);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-24);
  padding-left: var(--site-margins);
  padding-right: var(--site-margins);
  font-weight: var(--font-weight-normal);
  text-transform: uppercase;

  ${({ isMobile }) =>
    isMobile
      ? `
flex-wrap: nowrap;
`
      : `  flex-flow: wrap;
`}
`

const Wide = styled.ul`
  padding-inline-start: 0;
  list-style: none;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  background-color: var(--black);
  color: var(--white);
  align-items: center;
`

const Narrow = styled.ul`
  background-color: #222;
  list-style: none;
  margin-left: var(--site-margins);
  margin-right: var(--site-margins);
  margin-top: 0;
  padding: 0;
  text-align: center;
  z-index: 1;
  position: absolute;
  top: 111px;
  height: 295px;
  right: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
`

const Logo = styled.div`
  background-color: var(--black);
  margin-right: 78px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: var(--logo-width);
  padding-top: var(--a-modest-space);
  padding-bottom: var(--a-modest-space);
`

const NavEntry = styled(props => <a {...props} />)`
  padding: var(--a-small-space);
  color: var(--white);
  white-space: nowrap;

  &:visited {
    color: var(--white);
  }
`

const ActiveEntry = styled(props => <Link {...props} />)`
  width: 100%;
  white-space: nowrap;

  ${({ isMobile }) =>
    isMobile
      ? `
     &:visited {
    color: var(--red);
  }
      `
      : `
&:visited {
color: var(--white);
}

&:after {
    margin-top: 8px;
    content: "";
    display: block;
    width: 100%;
    height: 4px;
    border-radius: 4px;
    background: var(--red);
  }

`}
}
`

const CallToAction = styled(props => <a {...props} />)`
  white-space: nowrap;
  color: var(--white);
  padding-top: 6px;
  padding-bottom: 6px;
  padding-left: 12px;
  padding-right: 12px;
  margin-left: 6px;
  border: 1px solid white;

  &:visited {
    color: var(--white);
  }
`

const Navigation = () => {
  const isMobile = useMediaQuery({ query: "(max-width: 1024px)" })
  const [open, setOpen] = React.useState(false)

  const handleOpen = () => {
    setOpen(!open)
  }

  const underlinePadding = isMobile ? "0px" : "12px"
  const menus = (
    <>
      <li>
        <NavEntry href="https://quarkus.io/get-started/">Get started</NavEntry>
      </li>
      <li>
        <NavEntry href="https://quarkus.io/guides/">Guides</NavEntry>
      </li>
      <li style={{ marginTop: underlinePadding }}>
        <ActiveEntry isMobile={isMobile} to="/">
          Extensions
        </ActiveEntry>
      </li>
      <li>
        <NavEntry href="https://quarkus.io/discussion/">Community</NavEntry>
      </li>
      <li>
        <NavEntry href="https://quarkus.io/support/">Support</NavEntry>
      </li>
      <li>
        <NavEntry href="https://quarkus.io/blog/">Blog</NavEntry>
      </li>
      <li>
        <CallToAction href="https://code.quarkus.io/">
          Start Coding
        </CallToAction>
      </li>
      <li></li>
      {/* Lazy padder to get the call to action off the bottom of the menu */}
    </>
  )

  return (
    <NavBar isMobile={isMobile} className="navigation">
      <Logo>
        <StaticImage
          className="logo"
          placeholder="none"
          backgroundcolor="black"
          layout="constrained"
          formats={["auto", "webp", "avif"]}
          src="../images/quarkus_logo_horizontal_rgb_600px_reverse.png"
          alt="Quarkus logo"
        />
      </Logo>

      {isMobile && (
        <NavToggle onClick={handleOpen}>
          <FontAwesomeIcon icon={faBars} title={"bars"} />
        </NavToggle>
      )}
      {isMobile && open && <Narrow> {menus} </Narrow>}

      {!isMobile && <Wide>{menus}</Wide>}
    </NavBar>
  )
}

export default Navigation
