import { generateMavenInfo, getLatestVersionFromMavenMetadata, initMavenCache } from "./maven-info"
import { clearCaches } from "../../plugins/github-enricher/sponsorFinder"

const fs = require("fs")

jest.mock("./maven-url")
const axios = require("axios")
jest.mock("axios")

const {
  createMavenUrlFromCoordinates,
  createMavenPomUrlFromCoordinates, createMavenMetadataUrlFromCoordinates
} = require("./maven-url")

const resolvedMavenUrl = "http://some.url.mvn"
createMavenUrlFromCoordinates.mockImplementation(coordinates =>
  coordinates ? resolvedMavenUrl : undefined
)
createMavenPomUrlFromCoordinates.mockImplementation(coordinates =>
  coordinates ? "http://repo1.some.mvn" : undefined
)
createMavenMetadataUrlFromCoordinates.mockResolvedValue("http://mocked.value")

const mavenMetadata = fs.readFileSync("__mocks__/test-data/maven-metadata.xml", "utf8")

describe("the maven version finder", () => {
  beforeEach(async () => {
    axios.get.mockResolvedValue({
      "data": mavenMetadata
    })
  })

  it("gets the latest version", async () => {
    const version = await getLatestVersionFromMavenMetadata("ignored", "mock")
    expect(version).toBe("3.14.2")
  })
})

describe("the maven information generator", () => {
  const artifact = "io.quarkus:quarkus-vertx::jar:3.0.0.Alpha1"

  beforeEach(async () => {
    axios.get.mockResolvedValue({
      "data": mavenMetadata
    })

    axios.head.mockResolvedValue({
      headers: {
        "last-modified": "Thu, 09 Feb 2023 15:18:12 GMT",
      },
    })

    clearCaches()
    await initMavenCache()
  })

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

    it("uses the cache on subsequent calls", async () => {
      // Warm the cache
      await generateMavenInfo(artifact)
      // There should be one call for the latest version, and one for the pom, but the exact value here is not critical
      const startingCallCount = axios.get.mock.calls.length
      // Now go again
      await generateMavenInfo(artifact)
      expect(axios.get.mock.calls.length).toBe(startingCallCount)
    })

    describe("when there is a relocation", () => {

      beforeEach(async () => {
        axios.get.mockResolvedValueOnce({
          "data": mavenMetadata
        })
        axios.get.mockResolvedValueOnce({
          "data": "<project><distributionManagement><relocation>\n" +
            "<groupId>io.quarkus</groupId>\n" +
            "<artifactId>newer-and-cooler</artifactId>\n" +
            "<version>3.14.2</version>" +
            "</relocation></distributionManagement></project>"
        })
      })

      it("adds a relocation", async () => {
        const mavenInfo = await generateMavenInfo(artifact)
        expect(mavenInfo.relocation).toStrictEqual({
          "artifactId": "newer-and-cooler",
          "groupId": "io.quarkus",
          "version": "3.14.2"
        })
      })
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
      axios.get.mockRejectedValue(
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
