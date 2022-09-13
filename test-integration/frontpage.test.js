jest.setTimeout(15 * 1000)

const { port } = require("../jest-puppeteer.config").server

const siteRoot = `http://localhost:${port}`

describe("main site", () => {
  beforeAll(async () => {
    await page.goto(siteRoot)
  })

  it("should have Quarkus on it somewhere", async () => {
    await expect(
      page.waitForXPath(`//*[text()="Quarkus"]`)
    ).resolves.toBeTruthy()
  })

  it("should have Quarkiverse on it somewhere", async () => {
    await expect(
      page.waitForXPath(`//*[text()="Welcome to the Quarkiverse"]`)
    ).resolves.toBeTruthy()
  })

  describe("extensions list", () => {
    it("should have a well-known extension", async () => {
      await expect(
        page.waitForXPath('//*[text()="Some extension"]')
      ).resolves.toBeTruthy()
    })

    it("should have more than one well-known extension", async () => {
      await expect(
        page.waitForXPath('//*[text()="A third extension"]')
      ).resolves.toBeTruthy()
    })
  })

  describe("header navigation bar", () => {
    xit("should have a Guides option", async () => {
      await expect(
        page.waitForXPath('//*[text()="Guides"]')
      ).resolves.toBeTruthy()
    })

    xit("should have a Support option", async () => {
      await expect(
        page.waitForXPath('//*[text()="Support"]')
      ).resolves.toBeTruthy()
    })
  })
})
