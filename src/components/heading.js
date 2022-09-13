/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import * as React from "react"
import { StaticImage } from "gatsby-plugin-image"
import { Link } from "gatsby"

const Heading = ({ title }) => {
  return (
    <div className="heading">
      {/* This will be invisible for the moment, which is fine */}
      <h1 className="main-heading" style={{ position: "absolute" }}>
        <Link to="/">{title}</Link>
      </h1>

      <StaticImage
        className="fake-content"
        layout="constrained"
        formats={["auto", "webp", "avif"]}
        src="../images/heading.png"
        width={2320}
        height={386}
        alt={title}
      />
    </div>
  )
}

export default Heading
