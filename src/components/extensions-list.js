/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import * as React from "react"
import { StaticImage } from "gatsby-plugin-image"

const ExtensionsList = () => {
  return (
    <div className="extensions-list">
      <StaticImage
        className="fake-content"
        layout="fixed"
        formats={["auto", "webp", "avif"]}
        src="../images/extensions.png"
        width={2330}
        height={776}
        alt="A list of dummy extensions"
      />
    </div>
  )
}

export default ExtensionsList
