/**
 * @jest-environment node
 */

jest.mock("axios")

const {
  createJavadocUrlFromCoordinates, initMavenCache, initJavadocCache,
} = require("./javadoc-url")
const axios = require("axios")

describe("Javadoc url generator", () => {

  describe("when the javadoc exists", () => {

    const coords = {
      groupId: "io.quarkiverse.neo4j",
      artifactId: "quarkus-neo4j",
      version: "4.0.0",
    }

    beforeEach(async () => {
      await initJavadocCache()
      axios.get.mockReturnValue({ data: "      <iframe class=\"content\" src=\"/static/io.quarkiverse.neo4j/quarkus-neo4j/4.0.0/index.html\" @load=\"iframeLoad\" ref=\"docContainer\"></iframe>\n" })
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it("turns coordinates into sensible urls", async () => {
      expect(
        await createJavadocUrlFromCoordinates(coords)
      ).toBe(
        "https://javadoc.io/doc/io.quarkiverse.neo4j/quarkus-neo4j/4.0.0/index.html"
      )
    })

    it("validates urls exist", async () => {
      await createJavadocUrlFromCoordinates(coords)
      expect(axios.get).toHaveBeenCalled()
    })
  })

  describe("when the javadoc has not been uploaded for an extension", () => {

    const coords = {
      groupId: "io.quarkiverse.amazonalexa",
      artifactId: "quarkus-amazon-alexa",
      version: "1.0.5",
    }

    beforeEach(async () => {
      await initJavadocCache()
      axios.get.mockReturnValue({
        data: "<div class=\"alert alert-info\">\n" +
          "        No JavaDoc is released for artifact <span class=\"font-italic\">io.quarkiverse.amazonalexa:quarkus-amazon-alexa:1.0.5</span>.\n" +
          "        Please try other versions.\n"
      })
    })

    it("returns null if it cannot deduce a valid url", async () => {
      expect(await createJavadocUrlFromCoordinates(coords)).toBeUndefined()
    })
  })
})
