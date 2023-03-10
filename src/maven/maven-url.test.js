const urlExist = require("url-exist")
jest.mock("url-exist")

const {
  createMavenUrlFromCoordinates,
  createMavenUrlFromArtifactString,
  createMavenArtifactsUrlFromCoordinates,
} = require("./maven-url")

describe("maven url generator", () => {
  const gav =
    "io.quarkiverse.micrometer.registry:quarkus-micrometer-registry-datadog::jar:2.12.0"

  beforeEach(() => {
    urlExist.mockReturnValue(true)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("human-readable url generator", () => {
    it("turns coordinates into sensible urls", async () => {
      expect(
        await createMavenUrlFromCoordinates({
          groupId: "fred",
          artifactId: "george",
          version: 0.1,
        })
      ).toBe("https://central.sonatype.com/artifact/fred/george/0.1/jar")
    })

    it("turns artifacts into sensible urls", async () => {
      expect(await createMavenUrlFromArtifactString(gav)).toBe(
        "https://central.sonatype.com/artifact/io.quarkiverse.micrometer.registry/quarkus-micrometer-registry-datadog/2.12.0/jar"
      )
    })
  })

  describe("artifact-download url generator", () => {
    it("turns coordinates into sensible urls", async () => {
      expect(
        await createMavenArtifactsUrlFromCoordinates({
          groupId: "io.quarkiverse.amazonalexa",
          artifactId: "quarkus-amazon-alexa",
          version: "1.0.5",
        })
      ).toBe(
        "https://repo1.maven.org/maven2/io/quarkiverse/amazonalexa/quarkus-amazon-alexa/1.0.5/quarkus-amazon-alexa-1.0.5.pom"
      )
    })

    it("validates urls exist", async () => {
      await createMavenArtifactsUrlFromCoordinates(gav)
      expect(urlExist).toHaveBeenCalled()
    })

    it("returns null if it cannot deduce a valid url", async () => {
      await urlExist.mockReturnValue(false)
      expect(await createMavenArtifactsUrlFromCoordinates(gav)).toBeUndefined()
    })
  })
})
