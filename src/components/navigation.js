/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import * as React from "react"
import { StaticImage } from "gatsby-plugin-image"

const Navigation = () => {
  const data = {
    site: {},
  }

  return (
    <div className="navigation">
      <StaticImage
        className="fake-content"
        layout="fixed"
        formats={["auto", "webp", "avif"]}
        src="../images/navigation-bar.png"
        width={2330}
        height={144}
        alt="Static navigation bar"
      />
      {/* This will be invisible for the moment, which is fine */}
      <p style={{ position: "absolute" }}>Quarkus</p>
    </div>
  )
}

export default Navigation
