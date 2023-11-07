jest.setTimeout(25 * 1000)

const { port } = require("../jest-puppeteer.config").server

const siteRoot = `http://localhost:${port}/${process.env.PATH_PREFIX || ""}`

describe("an extension details page", () => {

  // We have to hardcode an extension name, so choose one we know is stable
  beforeAll(async () => {
    const url = `${siteRoot}/io.quarkus/quarkus-hibernate-orm`
    await page.goto(url)
  })

  it("should have a Quarkus logo", async () => {
    // At the moment we use a non-specific alt text for the icon
    await expect(
      page.waitForXPath(`//img[contains(@alt,"The icon of the organisation")]`)
    ).resolves.toBeTruthy()
  })

  it("should not have the generic placeholder logo", async () => {
    // At the moment we use the following alt text for placeholders A generic image as a placeholder for the extension icon
    const greyImage = await page
      .waitForXPath("//img[contains(@alt,\"placeholder\") or contains(@alt,\"generic\")]", { timeout: 2000 })
      .catch(() => {
        visible = false
      })
    expect(greyImage).toBeFalsy()
  })

  it("should have the extension name", async () => {
    await expect(
      page.waitForXPath(`//*[text()="Hibernate ORM"]`)
    ).resolves.toBeTruthy()
  })

  it("should have a publish date", async () => {
    await expect(
      page.waitForXPath(`//*[text()="Publish Date"]`)
    ).resolves.toBeTruthy()
  })

  it("should show the status", async () => {
    await expect(
      page.waitForXPath(`//*[text()="Status"]`)
    ).resolves.toBeTruthy()
    await expect(
      page.waitForXPath(`//*[text()="stable"]`)
    ).resolves.toBeTruthy()
  })

  it("should have a link to the documentation", async () => {
    await expect(
      page.waitForXPath(`//*[contains(text(), "documentation")]`)
    ).resolves.toBeTruthy()
  })

  it("should show the issue count", async () => {
    await expect(
      page.waitForXPath(`//*[text()="Issues"]`)
    ).resolves.toBeTruthy()
  })

  it("should show a community tab", async () => {
    await expect(
      page.waitForXPath(`//*[text()="Community"]`)
    ).resolves.toBeTruthy()
  })

  it("should show a sponsor", async () => {
    await expect(
      page.waitForXPath(`//*[text()="Sponsor"]`)
    ).resolves.toBeTruthy()
  })

})
