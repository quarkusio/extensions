import prettyPlatform from "./pretty-platform"

describe("platform name formatter", () => {
  it("handles arbitrary strings", () => {
    expect(prettyPlatform("marshmallows")).toBe("Marshmallows")
  })

  it("handles nulls", () => {
    expect(prettyPlatform()).toBe()
  })

  it("handles non-platform platforms", () => {
    expect(
      prettyPlatform(
        "io.quarkus.registry:quarkus-non-platform-extensions:2.0.7:json:1.0-SNAPSHOT"
      )
    ).toBe("Non Platform Extensions")
  })

  it("handles quarkus core", () => {
    expect(
      prettyPlatform(
        '"io.quarkus.platform:quarkus-bom-quarkus-platform-descriptor:2.1.0.Final:json:2.1.0.Final"'
      )
    ).toBe("Quarkus Platform")
  })
})
