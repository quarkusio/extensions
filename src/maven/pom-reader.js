const xml2js = require("xml2js")
const parser = new xml2js.Parser({ explicitArray: false, trim: true })

module.exports.readPom = async (pom) => {

  // Note that this parser returns a promise, so needs an await on the other side
  const raw = await parser.parseStringPromise(pom)

  let distributionManagement = raw?.project?.distributionManagement
  let relocation = distributionManagement?.relocation

  return { relocation }
}