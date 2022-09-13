import * as React from "react"
import { StaticImage } from "gatsby-plugin-image"

const Filters = () => {
  return (
    <div className="filters">
      <StaticImage
        className="fake-content"
        layout="constrained"
        formats={["auto", "webp", "avif"]}
        src="../images/filters.png"
        width={282}
        height={1160}
        alt="A list of dummy extensions"
      />
    </div>
  )
}

export default Filters
