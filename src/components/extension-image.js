import * as React from "react"
import { GatsbyImage, getImage, StaticImage } from "gatsby-plugin-image"

const ExtensionImage = ({ extension, size }) => {
  const metadata = extension.metadata
  const sourceControl = metadata.sourceControl

  let imageData, svgData
  let altText
  if (metadata && metadata.icon) {
    imageData = getImage(metadata.icon)
    if (!imageData) {
      svgData = metadata.icon.publicURL
    }
    altText = "The icon of the project"
  } else if (sourceControl?.projectImage) {
    imageData = getImage(sourceControl.projectImage)
    altText = "The icon of the project"
  } else if (sourceControl?.ownerImage) {
    imageData = getImage(sourceControl.ownerImage)
    altText = "The icon of the organisation"
  }
  if (svgData) {
    return <img src={svgData} alt={altText} height={size} width={size} />
  } else if (imageData) {
    return <GatsbyImage layout="constrained" image={imageData} alt={altText} />
  } else {
    return (
      <StaticImage
        layout="constrained"
        formats={["auto", "webp", "avif"]}
        src="../images/generic-extension-logo.png"
        alt="A generic image as a placeholder for the extension icon"
      />
    )
  }
}

export default ExtensionImage
