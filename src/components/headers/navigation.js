import * as React from "react"
import { Link } from "gatsby"
import { StaticImage } from "gatsby-plugin-image"
import styled from "styled-components"
import { useMediaQuery } from "react-responsive"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBars, faGlobe } from "@fortawesome/free-solid-svg-icons"
import { NavEntry, Submenu } from "./submenu"

import config from "../../../gatsby-config.js"

const NavToggle = styled.label`
  font-size: 27.2px;
`

const NavBar = styled.nav`
  background-color: var(--black);
  color: var(--white);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  @media screen and (min-width: 1024px) and (max-width: 1450px) {
    justify-content: space-around;
  }

  align-items: center;
  flex-wrap: wrap;
  align-content: center;
  row-gap: 1rem;
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;

  padding: var(--navbar-padding) var(--site-margins);

  ${({ isMobile }) =>
    isMobile
      ? `
      flex-wrap: nowrap;
      column-gap: 1rem;

`
      : `  
      flex-flow: wrap;
      column-gap: 10rem;

`}
`

const DesktopNavigation = styled.ul`
  padding-inline-start: 0;
  list-style: none;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding-top: 0;
  padding-bottom: 0;
  align-content: center;
  align-items: center;
  background-color: var(--black);
  color: var(--white);
  margin: 0 0;
`

const MobileNavigation = styled.ul`
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
  right: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
`

const LogoWrapper = styled.div`
  height: 40px;
  display: flex;
  flex-direction: row;
  align-content: center;
  align-items: center;
`

const Logo = styled.a`
  background-color: var(--black);
  width: var(--logo-width);
  display: flex;
  // The main site sets a height, but that inflates and crops the image, so we need to do it in a wrapper div
`

const LangIcon = styled(({ ...props }) => <FontAwesomeIcon {...props} />)``

// This isn't needed on the main site, but we seem to need it here to properly pad the cta in the mobile menu, and also to get it to take the full width
const CallToActionWrapper = styled.li`
  display: flex;

  ${({ isMobile }) =>
    isMobile
      ? `
        padding: 15px 0;
`
      : `  
`}
`

const CallToAction = styled(props => <a {...props} />)`
  white-space: nowrap;
  color: var(--white);

  border: 2px solid white;
  border-radius: var(--border-radius);

  margin: 0.75rem 0.5rem;
  padding: 0 1rem;
  line-height: 1.8rem;
  width: 100%;

  font-weight: var(--font-weight-normal);

  &:visited {
    color: var(--white);
  }

  &:hover {
    color: var(--white);
    background-color: var(--link);
    border: 2px solid var(--link);
  }
`

const Navigation = () => {
  const isMobile = useMediaQuery({ query: "(max-width: 1024px)" })

  const [open, setOpen] = React.useState(false)

  const handleOpen = () => {
    setOpen(!open)
  }

  const about = (
    <Submenu title="About">
      <NavEntry>
        <a href={`${config.siteMetadata.parentSiteUrl}/about`}>
          What Is Quarkus?
        </a>
      </NavEntry>
      <NavEntry>
        <a href={`${config.siteMetadata.parentSiteUrl}/container-first`}>
          Container First
        </a>
      </NavEntry>
      <NavEntry>
        <a href={`${config.siteMetadata.parentSiteUrl}/continuum`}>Reactive</a>
      </NavEntry>
      <NavEntry>
        <a href={`${config.siteMetadata.parentSiteUrl}/developer-joy`}>
          Developer Joy
        </a>
      </NavEntry>
      <NavEntry>
        <a href={`${config.siteMetadata.parentSiteUrl}/kubernetes-native`}>
          Kubernetes Native
        </a>
      </NavEntry>
      <NavEntry>
        <a href={`${config.siteMetadata.parentSiteUrl}/standards`}>Standards</a>
      </NavEntry>
    </Submenu>
  )
  const learn = (
    <Submenu title="Learn">
      <NavEntry>
        <a href={`${config.siteMetadata.parentSiteUrl}/get-started`}>
          Get Started
        </a>
      </NavEntry>
      <NavEntry>
        <a href={`${config.siteMetadata.parentSiteUrl}/guides`}>Guides</a>
      </NavEntry>
      <NavEntry>
        <a href={`${config.siteMetadata.parentSiteUrl}/training`}>Training</a>
      </NavEntry>
      <NavEntry>
        <a href={`${config.siteMetadata.parentSiteUrl}/qtips`}>
          "Q" Tip Videos
        </a>
      </NavEntry>
      <NavEntry>
        <a href={`${config.siteMetadata.parentSiteUrl}/books`}>Books</a>
      </NavEntry>
    </Submenu>
  )
  const extensions = (
    <Submenu title="Extensions">
      <NavEntry current={true}>
        <Link to="/">Browse Extensions</Link>
      </NavEntry>
      <NavEntry>
        <a
          href={`${config.siteMetadata.parentSiteUrl}/faq/#what-is-a-quarkus-extension`}
        >
          Use Extensions
        </a>
      </NavEntry>
      {/* It would be excellent to have a page like https://access.redhat.com/documentation/en-us/red_hat_build_of_quarkus/1.3/html/developing_and_compiling_your_quarkus_applications_with_apache_maven/proc-installing-and-managing-java-extensions-with-quarkus-applications_quarkus-maven#doc-wrapper
       See https://github.com/quarkusio/quarkus/issues/27946 */}
      <NavEntry>
        <a
          href={`${config.siteMetadata.parentSiteUrl}/guides/writing-extensions`}
        >
          Create Extensions
        </a>
      </NavEntry>
      <NavEntry>
        <a href="https://hub.quarkiverse.io/">Publish Extensions</a>
      </NavEntry>
    </Submenu>
  )
  const community = (
    <Submenu title="Community">
      <NavEntry>
        <a href={`${config.siteMetadata.parentSiteUrl}/support/`}>Support</a>
      </NavEntry>
      <NavEntry>
        <a href={`${config.siteMetadata.parentSiteUrl}/blog`}>Blog</a>
      </NavEntry>
      <NavEntry>
        <a href={`${config.siteMetadata.parentSiteUrl}/discussion`}>
          Discussion
        </a>
      </NavEntry>
      <NavEntry>
        <a href={`${config.siteMetadata.parentSiteUrl}/insights`}>Podcast</a>
      </NavEntry>
      <NavEntry>
        <a href={`${config.siteMetadata.parentSiteUrl}/events`}>Events</a>
      </NavEntry>
      <NavEntry>
        <a href={`${config.siteMetadata.parentSiteUrl}/newsletter`}>
          Newsletter
        </a>
      </NavEntry>
      <NavEntry>
        <a href="https://github.com/orgs/quarkusio/projects/13/views/1">
          Roadmap
        </a>
      </NavEntry>
    </Submenu>
  )

  const callToAction = (
    <CallToActionWrapper>
      <CallToAction href="https://code.quarkus.io/">Start Coding</CallToAction>
    </CallToActionWrapper>
  )

  const langIcon = <LangIcon icon={faGlobe} title="globe" />

  const translations = (
    <Submenu title={langIcon}>
      <NavEntry>
        <a href={`${config.siteMetadata.siteUrl}`}>Official (English)</a>
      </NavEntry>
      <NavEntry>
        <a href={`${config.siteMetadata.translatedUrls.spanish}`}>Español</a>
      </NavEntry>
      <NavEntry>
        <a href={`${config.siteMetadata.translatedUrls.chinese}`}>简体中文</a>
      </NavEntry>
      <NavEntry>
        <a href={`${config.siteMetadata.translatedUrls.japanese}`}>日本語</a>
      </NavEntry>
    </Submenu>
  )

  const menus = (
    <>
      {about}
      {learn}
      {extensions}
      {community}
      {callToAction}
      {translations}
    </>
  )

  return (
    <NavBar isMobile={isMobile}>
      <LogoWrapper>
        <Logo href={config.siteMetadata.parentSiteUrl}>
          <StaticImage
            className="logo"
            placeholder="none"
            backgroundColor="black"
            src="../../images/quarkus_logo_horizontal_rgb_600px_reverse.png"
            alt="Quarkus logo"
          />
        </Logo>
      </LogoWrapper>
      {isMobile && (
        <NavToggle onClick={handleOpen}>
          <FontAwesomeIcon icon={faBars} title="bars" />
        </NavToggle>
      )}
      {isMobile && open && <MobileNavigation> {menus} </MobileNavigation>}
      {!isMobile && <DesktopNavigation>{menus}</DesktopNavigation>}
    </NavBar>
  )
}

export default Navigation
