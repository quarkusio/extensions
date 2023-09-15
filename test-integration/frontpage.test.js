jest.setTimeout(25 * 1000)

const { port } = require("../jest-puppeteer.config").server

const siteRoot = `http://localhost:${port}/${process.env.PATH_PREFIX}`

describe("main site", () => {
  beforeAll(async () => {
    await page.goto(siteRoot)
  })

  it("should have a Quarkus logo on it somewhere", async () => {
    await expect(
      page.waitForXPath(`//img[contains(@alt,"Quarkus")]`)
    ).resolves.toBeTruthy()
  })

  it("should have an extensions heading on it somewhere", async () => {
    await expect(
      page.waitForXPath(`//*[text()="Extensions"]`)
    ).resolves.toBeTruthy()
  })

  describe("extensions list", () => {
    it("should have a well-known non-platform extension", async () => {
      await expect(
        page.waitForXPath("//*[text()=\"RabbitMQ Client\"]")
      ).resolves.toBeTruthy()
    })

    it("should have more than one well-known non-platform extension", async () => {
      await expect(
        page.waitForXPath("//*[text()=\"GitHub App\"]")
      ).resolves.toBeTruthy()
    })

    it("should have a well-known platform extension", async () => {
      await expect(
        page.waitForXPath("//*[text()=\"Cache\"]")
      ).resolves.toBeTruthy()
    })

    it("should have more than one well-known platform extension", async () => {
      await expect(
        page.waitForXPath("//*[text()=\"gRPC\"]")
      ).resolves.toBeTruthy()
    })

    describe("filters", () => {
      it("should should filter out extensions when the search bar is used", async () => {
        // Sense check - is the thing we wanted there to start with
        await expect(
          page.waitForXPath("//*[text()=\"RabbitMQ Client\"]")
        ).resolves.toBeTruthy()
        await expect(
          page.waitForXPath("//*[text()=\"GitHub App\"]")
        ).resolves.toBeTruthy()

        await page.focus("input[name=\"search-regex\"]")
        await page.keyboard.type("Rabbit")

        // RabbitMQ should still be there ...
        await expect(
          page.waitForXPath("//*[text()=\"RabbitMQ Client\"]")
        ).resolves.toBeTruthy()
        // ... but others should be gone

        await page.waitForXPath("//*[text()=\"GitHub App\"]", { hidden: true })

        let visible = true
        const gitHubApp = await page
          .waitForXPath("//*[text()=\"GitHub App\"]", { timeout: 2000 })
          .catch(() => {
            visible = false
          })
        expect(gitHubApp).toBeFalsy()
      })
    })

    describe("header navigation bar", () => {
      it("should have a Start Coding button", async () => {
        await expect(
          page.waitForXPath("//*[text()=\"Start Coding\"]")
        ).resolves.toBeTruthy()
      })

      it("should have a Learn option", async () => {
        await expect(
          page.waitForXPath("//*[text()=\"Learn\"]")
        ).resolves.toBeTruthy()
      })
    })
  })

  // We sometimes see errors from half-disabled tracking code on the do not track path
  describe("when do not track is enabled", () => {
    it("should have an extensions heading on it somewhere", async () => {
      await page.setExtraHTTPHeaders({ DNT: "1" })
      await expect(
        page.waitForXPath(`//*[text()="Extensions"]`)
      ).resolves.toBeTruthy()
    })
  })
})
