import codeQuarkusUrl from "./code-quarkus-url"

describe("code quarkus url generator", () => {
  it("gracefully handles missing data", () => {
    expect(codeQuarkusUrl({})).toBeUndefined()
  })

  it("gracefully handles nonsense cases", () => {
    expect(codeQuarkusUrl({ artifact: "marshmallows" })).toBeUndefined()
  })

  it("returns a minimal query string for platform extensions", () => {
    expect(
      codeQuarkusUrl({
        artifact: "io.quarkus:quarkus-vertx:3.0.0.Final",
        platforms: ["quarkus-bom-quarkus-platform-descriptor"],
        streams: [
          {
            platformKey: "io.quarkus.platform",
            id: "2.15",
            isLatestThree: true,
          },
        ],
      })
    ).toBe("https://code.quarkus.io/?e=vertx&S=io.quarkus.platform%3A2.15")
  })

  it("returns a fully qualified query string for non-platform extensions", () => {
    expect(
      codeQuarkusUrl({
        artifact: "io.quarkiverse.amazonalexa:quarkus-amazon-alexa:1.0.5",
        platforms: ["quarkus-non-platform-extensions"],
        streams: [
          {
            platformKey: "io.quarkus.not-platform",
            id: "2.15",
            isLatestThree: true,
          },
        ],
      })
    ).toBe(
      "https://code.quarkus.io/?e=io.quarkiverse.amazonalexa%3Aquarkus-amazon-alexa"
    )
  })

  // Make a (risky, but better than the alternative) assumption that the things in alphas were also in previous releases
  it("returns a url, but with no stream, for alphas", () => {
    expect(
      codeQuarkusUrl({
        artifact: "io.quarkus:quarkus-vertx:3.0.0.Alpha3",
        platforms: ["quarkus-bom-quarkus-platform-descriptor"],
        streams: [
          {
            platformKey: "io.quarkus.platform",
            id: "3.0.0.Alpha4",
            isLatestThree: true,
            isAlpha: true,
          },
        ],
      })
    ).toBe("https://code.quarkus.io/?e=vertx")
  })

  it("does not attempt to build a url for unlisted extensions", () => {
    expect(
      codeQuarkusUrl({
        artifact:
          "io.quarkus:quarkus-elytron-security-common::jar:3.0.0.Alpha3",
        platforms: ["quarkus-non-platform-extensions"],
        streams: [
          {
            platformKey: "io.quarkus.not-platform",
            id: "2.15",
            isLatestThree: true,
          },
        ],
        unlisted: true,
      })
    ).toBeUndefined
  })

  it("does not attempt to build a url for very old streams", () => {
    expect(
      codeQuarkusUrl({
        artifact: "io.quarkus:quarkus-vertx:3.0.0.Alpha3",
        platforms: ["quarkus-bom-quarkus-platform-descriptor"],
        streams: [
          {
            platformKey: "io.quarkus.platform",
            id: "2.15",
            isLatestThree: false,
          },
        ],
      })
    ).toBeUndefined()
  })
})
