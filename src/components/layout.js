import * as React from "react"
import Navigation from "./navigation"
import Heading from "./heading"

const Layout = ({ location, title, children }) => {
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
      <div>
        <Navigation />
      </div>
    )
  }

  return (
    <div
      className="global-wrapper"
      data-is-root-path={isRootPath}
      style={{ width: "1920px" }}
    >
      <header className="global-header">{header}</header>
      {children}
    </div>
  )
}

export default Layout
