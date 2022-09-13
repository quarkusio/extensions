import * as React from "react"
import { StaticImage } from "gatsby-plugin-image"

const ExtensionCard = () => {
  return (
    <div className="extensions-list" style={{ padding: "20px" }}>
      <StaticImage
        className="fake-content"
        layout="fixed"
        formats={["auto", "webp", "avif"]}
        src="../images/extension-card.png"
        width={360}
        height={570}
        alt="A list of dummy extensions"
      />
    </div>
  )
}

export default ExtensionCard
