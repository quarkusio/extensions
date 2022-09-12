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
      <StaticImage
        className="fake-content"
        layout="fixed"
        formats={["auto", "webp", "avif"]}
        src="../images/heading.png"
        width={2330}
        height={386}
        alt={title}
      />
      <h1 className="main-heading">
        <Link to="/">{title}</Link>
      </h1>
    </div>
  )
}

export default Heading
