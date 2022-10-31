import * as React from "react"
import { Link } from "gatsby"
import { StaticImage } from "gatsby-plugin-image"
import styled from "styled-components"

const NavBar = styled.nav`
  height: 119px;
  background-color: var(--black);
  color: var(--white);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-24);
  padding-left: 208px;
  padding-right: 208px;
  font-weight: var(--font-weight-normal);
  text-transform: uppercase;
`
const Logo = styled.div`
  background-color: var(--black);
  margin-right: 78px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  height: 52px;
  line-height: 46px;
  width: 340px;
  font-size: 50px;
  letter-spacing: 5.5px;
  font-weight: var(--font-weight-bold);
`

const NavEntry = styled(props => <a {...props} />)`
  &:visited {
    color: var(--white);
  }
`

const ActiveEntry = styled(props => <Link {...props} />)`
  margin-top: 12px;

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
`

const CallToAction = styled(props => <a {...props} />)`
  padding-top: 8px;
  padding-bottom: 8px;
  padding-left: 12px;
  padding-right: 12px;
  margin-left: 6px;
  border: 1px solid white;

  &:visited {
    color: var(--white);
  }
`

const Navigation = () => {
  return (
    <NavBar className="navigation">
      <Logo>
        <StaticImage
          className="logo"
          placeholder="none"
          backgroundcolor="black"
          layout="constrained"
          formats={["auto", "webp", "avif"]}
          src="../images/quarkus-logo.png"
          height={50}
          alt="Quarkus logo"
        />
        Quarkus
      </Logo>
      <NavEntry href="https://quarkus.io/get-started/">Get started</NavEntry>
      <NavEntry href="https://quarkus.io/guides/">Guides</NavEntry>
      <ActiveEntry to="/">Extensions</ActiveEntry>
      <NavEntry href="https://quarkus.io/discussion/">Community</NavEntry>
      <NavEntry href="https://quarkus.io/support/">Support</NavEntry>
      <NavEntry href="https://quarkus.io/blog/">Blog</NavEntry>
      <CallToAction href="https://code.quarkus.io/">Start Coding</CallToAction>
    </NavBar>
  )
}

export default Navigation
