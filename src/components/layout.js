import * as React from "react"
import { Link } from "gatsby"
import Navigation from "./navigation"
import Heading from "./heading"
import ExtensionsList from "./extensions-list"

const Layout = ({ location, title, extensions }) => {
  const rootPath = `${__PATH_PREFIX__}/`
  const isRootPath = location.pathname === rootPath
  let header

  if (isRootPath) {
    header = (
      <div>
        <Navigation />
        <Heading title={title} />
      </div>
    )
  } else {
    header = (
      <Link className="header-link-home" to="/">
        {title}
      </Link>
    )
  }

  return (
    <div className="global-wrapper" data-is-root-path={isRootPath}>
      <header className="global-header">{header}</header>
      <ExtensionsList extensions={extensions} />
    </div>
  )
}

export default Layout
