import { generateMavenInfo } from "./maven-info"

jest.mock("./maven-url")
const axios = require("axios")
jest.mock("axios")

const {
  createMavenUrlFromCoordinates,
  createMavenArtifactsUrlFromCoordinates,
} = require("./maven-url")

const resolvedMavenUrl = "http://some.url.mvn"
createMavenUrlFromCoordinates.mockImplementation(coordinates =>
  coordinates ? resolvedMavenUrl : undefined
)
createMavenArtifactsUrlFromCoordinates.mockImplementation(coordinates =>
  coordinates ? "http://repo1.some.mvn" : undefined
)


// eslint-disable-next-line jest/no-mocks-import
const expectedMavenCentralResponse = require("../../__mocks__/test-data/solrsearch.json")
axios.get.mockReturnValue(expectedMavenCentralResponse)
axios.head.mockReturnValue({
  headers: {
    "last-modified": "Thu, 09 Feb 2023 15:18:12 GMT",
  },
})

describe("the maven information generator", () => {
  const artifact = "io.quarkus:quarkus-vertx::jar:3.0.0.Alpha1"

  describe("when the repo listing is working well", () => {
    it("adds a maven url", async () => {
      const mavenInfo = await generateMavenInfo(artifact)
      expect(mavenInfo.url).toBe(resolvedMavenUrl)
    })

    it("adds a version", async () => {
      const mavenInfo = await generateMavenInfo(artifact)
      expect(mavenInfo.version).toBe("3.0.0.Alpha1")
    })

    it("adds a timestamp", async () => {
      const mavenInfo = await generateMavenInfo(artifact)
      expect(mavenInfo.timestamp).toBe(1675955892000)
    })
  })

  describe("when the repository listing has errors", () => {
    beforeEach(() => {
      axios.head.mockRejectedValue("deliberate error")
    })

    it("forms a good query to maven central", async () => {
      await generateMavenInfo(artifact)
      let searchUrl = "https://search.maven.org/solrsearch/select"
      expect(axios.get).toHaveBeenLastCalledWith(
        searchUrl,
        expect.objectContaining({
          params: expect.objectContaining({
            q: expect.stringMatching(/v:3.0.0.Alpha1/),
          }),
        })
      )
      expect(axios.get).toHaveBeenLastCalledWith(
        searchUrl,
        expect.objectContaining({
          params: expect.objectContaining({
            q: expect.stringMatching(/a:quarkus-vertx/),
          }),
        })
      )

      expect(axios.get).toHaveBeenLastCalledWith(
        searchUrl,
        expect.objectContaining({
          params: expect.objectContaining({
            q: expect.stringMatching(/g:io.quarkus/),
          }),
        })
      )
    })

    it("handles errors in maven central gracefully", async () => {
      axios.get.mockRejectedValueOnce(
        "(this is a deliberate error to exercise the error path)"
      )
      const mavenInfo = await generateMavenInfo(artifact)
      expect(mavenInfo.timestamp).toBeUndefined()

      // Other information should be present and correct
      expect(mavenInfo.version).toBe("3.0.0.Alpha1")
      expect(mavenInfo.url).toBe(resolvedMavenUrl)
    })
  })
})
