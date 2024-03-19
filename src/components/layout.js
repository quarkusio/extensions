import * as React from "react"
import { library } from "@fortawesome/fontawesome-svg-core"
import { faAngleRight, faClipboard, faClipboardCheck, faR, faSquareCheck, } from "@fortawesome/free-solid-svg-icons"
import { faSquare } from "@fortawesome/free-regular-svg-icons"
import {
  faCreativeCommons,
  faCreativeCommonsBy,
  faGitAlt,
  faGithub,
  faGitlab
} from "@fortawesome/free-brands-svg-icons"
import Navigation from "./headers/navigation"
import TitleBand from "./headers/title-band"
import Footer from "./footer"
import styled from "styled-components"

library.add(
  faAngleRight,
  faClipboard,
  faClipboardCheck,
  faSquare,
  faSquareCheck,
  faCreativeCommons,
  faCreativeCommonsBy,
  faR,
  faGitAlt,
  faGithub,
  faGitlab
)

const GlobalWrapper = styled.div`
  color: var(--main-text-color);
  background-color: var(--main-background-color);
`

const Layout = ({ location, title, children }) => {
  const rootPath = `${__PATH_PREFIX__}/`
  const isRootPath = location.pathname === rootPath
  let header

  if (isRootPath) {
    header = (
      <GlobalWrapper>
        <Navigation />
        <TitleBand title={title} />
      </GlobalWrapper>
    )
  } else {
    header = (
      <GlobalWrapper>
        <Navigation />
      </GlobalWrapper>
    )
  }

  return (
    <GlobalWrapper className="global-wrapper" data-is-root-path={isRootPath}>
      <header className="global-header">{header}</header>
      {children}
      <Footer />
    </GlobalWrapper>
  )
}

export default Layout
