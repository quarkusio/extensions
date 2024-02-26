const axios = require("axios")
const { validateBufferMIMEType } = require("validate-image-type")

const validate = async url => {
  try {
    const response = await axios
      .get(url, {
        responseType: "arraybuffer"
      })
    const buffer = Buffer.from(response.data, "binary")

    const result = await validateBufferMIMEType(buffer, {
      allowMimeTypes: ["image/jpeg", "image/png", "image/tiff", "image/webp", "image/svg+xml"] // This list is https://www.gatsbyjs.com/plugins/gatsby-transformer-sharp#parsing-algorithm + svg
    })
    return result.ok
  } catch {
    // Squash the error, since we'll log the problem URL
  }
  return false
}

module.exports = { validate }
