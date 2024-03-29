jest.setTimeout(25 * 1000)

const { port } = require("../jest-puppeteer.config").server

const siteRoot = `http://localhost:${port}/${process.env.PATH_PREFIX || ""}`

describe("main site", () => {
  beforeAll(async () => {
    await page.goto(siteRoot)
  })

  it("should have a Quarkus logo on it somewhere", async () => {
    await expect(
      page.waitForSelector(`xpath///img[contains(@alt,"Quarkus")]`)
    ).resolves.toBeTruthy()
  })

  it("should have an extensions heading on it somewhere", async () => {
    await expect(
      page.waitForSelector(`xpath///*[text()="Extensions"]`)
    ).resolves.toBeTruthy()
  })

  describe("extensions list", () => {
    it("should have a well-known non-platform extension", async () => {
      await expect(
        page.waitForSelector("xpath///*[text()=\"RabbitMQ Client\"]")
      ).resolves.toBeTruthy()
    })

    it("should have more than one well-known non-platform extension", async () => {
      await expect(
        page.waitForSelector("xpath///*[text()=\"GitHub App\"]")
      ).resolves.toBeTruthy()
    })

    it("should have a well-known platform extension", async () => {
      await expect(
        page.waitForSelector("xpath///*[text()=\"Cache\"]")
      ).resolves.toBeTruthy()
    })

    it("should have more than one well-known platform extension", async () => {
      await expect(
        page.waitForSelector("xpath///*[text()=\"gRPC\"]")
      ).resolves.toBeTruthy()
    })

    describe("filters", () => {
      it("should should filter out extensions when the search bar is used", async () => {
        // Sense check - is the thing we wanted there to start with
        await expect(
          page.waitForSelector("xpath///*[text()=\"RabbitMQ Client\"]")
        ).resolves.toBeTruthy()
        await expect(
          page.waitForSelector("xpath///*[text()=\"GitHub App\"]")
        ).resolves.toBeTruthy()

        await page.focus("input[name=\"search-regex\"]")
        await page.keyboard.type("Rabbit")

        // RabbitMQ should still be there ...
        await expect(
          page.waitForSelector("xpath///*[text()=\"RabbitMQ Client\"]")
        ).resolves.toBeTruthy()
        // ... but others should be gone

        await page.waitForSelector("xpath///*[text()=\"GitHub App\"]", { hidden: true })

        const gitHubApp = await page
          .waitForSelector("xpath///*[text()=\"GitHub App\"]", { timeout: 2000 })
          .catch(() => {
            return false
          })
        expect(gitHubApp).toBeFalsy()
      })
    })

    describe("header navigation bar", () => {
      it("should have a Start Coding button", async () => {
        await expect(
          page.waitForSelector("xpath///*[text()=\"Start Coding\"]")
        ).resolves.toBeTruthy()
      })

      it("should have a Learn option", async () => {
        await expect(
          page.waitForSelector("xpath///*[text()=\"Learn\"]")
        ).resolves.toBeTruthy()
      })
    })
  })

  // We sometimes see errors from half-disabled tracking code on the do not track path
  describe("when do not track is enabled", () => {
    it("should have an extensions heading on it somewhere", async () => {
      await page.setExtraHTTPHeaders({ DNT: "1" })
      await expect(
        page.waitForSelector(`xpath///*[text()="Extensions"]`)
      ).resolves.toBeTruthy()
    })
  })
})
