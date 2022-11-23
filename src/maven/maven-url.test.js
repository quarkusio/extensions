const urlExist = require("url-exist")
jest.mock("url-exist")

const {
  createMavenUrlFromCoordinates,
  createMavenUrlFromArtifactString,
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

  it("turns coordinates into sensible urls", async () => {
    expect(
      await createMavenUrlFromCoordinates({
        groupId: "fred",
        artifactId: "george",
        version: 0.1,
      })
    ).toBe("https://search.maven.org/artifact/fred/george/0.1/jar")
  })

  it("turns artifacts into sensible urls", async () => {
    expect(await createMavenUrlFromArtifactString(gav)).toBe(
      "https://search.maven.org/artifact/io.quarkiverse.micrometer.registry/quarkus-micrometer-registry-datadog/2.12.0/jar"
    )
  })

  it("validates urls exist", async () => {
    await createMavenUrlFromArtifactString(gav)
    expect(urlExist).toHaveBeenCalled()
  })

  it("returns null if it cannot deduce a valid url", async () => {
    await urlExist.mockReturnValue(false)
    expect(await createMavenUrlFromArtifactString(gav)).toBeUndefined()
  })
})
