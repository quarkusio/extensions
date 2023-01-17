const smartcrop = require("smartcrop-sharp")
const sharp = require("sharp")

const crop = async image => {
  const sharped = sharp(image)
  const sharpImage = sharp(image)
  const metadata = await sharped.metadata()

  // Assume a portrait format, and crop to the height
  const width = metadata.height
  const height = metadata.height

  const coords = await smartcrop.crop(image, {
    width,
    height,
    ruleOfThirds: false,
  })
  const crop = coords.topCrop
  return sharpImage
    .extract({
      width: crop.width,
      height: crop.height,
      left: crop.x,
      top: crop.y,
    })
    .resize(width, height)
    .toBuffer()
}

module.exports = { crop }
