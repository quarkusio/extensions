import * as React from "react"
import { GatsbyImage, getImage, StaticImage } from "gatsby-plugin-image"

const ExtensionImage = ({ extension }) => {
  const metadata = extension.metadata
  const sourceControl = metadata.sourceControl

  let imageData
  let altText
  if (metadata && metadata["icon-url"]) {
    imageData = getImage(metadata["icon-url"])
    altText = "The logo of the project"
  } else if (sourceControl?.projectImage) {
    imageData = getImage(sourceControl.projectImage)
    altText = "The logo of the project"
  } else if (sourceControl?.ownerImage) {
    imageData = getImage(sourceControl.ownerImage)
    altText = "The logo of the organisation"
  }

  if (imageData) {
    return <GatsbyImage layout="constrained" image={imageData} alt={altText} />
  } else {
    return (
      <StaticImage
        layout="constrained"
        formats={["auto", "webp", "avif"]}
        src="../images/generic-extension-logo.png"
        alt="A generic image as a placeholder for the extension logo"
      />
    )
  }
}

export default ExtensionImage
