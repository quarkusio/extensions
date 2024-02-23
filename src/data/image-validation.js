const sharp = require("sharp")
const axios = require("axios")

const validate = async url => {
  try {
    const response = await axios
      .get(url, {
        responseType: "arraybuffer"
      })
    const buffer = Buffer.from(response.data, "binary")


    const sharped = sharp(buffer)
    return sharped.stats().then(() => true).catch(() => false)
  } catch {
  }
  return false
}

module.exports = { validate }
