import { getPlatformId, prettyPlatformName } from "./pretty-platform"

describe("platform name formatter", () => {
  it("handles arbitrary strings", () => {
    expect(prettyPlatformName("marshmallows")).toBe("Marshmallows")
  })

  it("handles nulls", () => {
    expect(prettyPlatformName()).toBe()
  })

  it("handles non-platform platforms", () => {
    expect(prettyPlatformName("quarkus-non-platform-extensions")).toBe(
      "Non Platform Extensions"
    )
  })

  it("handles quarkus core", () => {
    expect(prettyPlatformName("quarkus-bom-quarkus-platform-descriptor")).toBe(
      "Quarkus Platform"
    )
  })
})

describe("platform id extracter", () => {
  it("handles arbitrary strings", () => {
    expect(getPlatformId("marshmallows")).toBe("marshmallows")
  })

  it("handles nulls", () => {
    expect(getPlatformId()).toBe()
  })

  it("handles non-platform platforms", () => {
    expect(
      getPlatformId(
        "io.quarkus.registry:quarkus-non-platform-extensions:2.0.7:json:1.0-SNAPSHOT"
      )
    ).toBe("quarkus-non-platform-extensions")
  })

  it("handles arbitrary GAVs", () => {
    expect(getPlatformId('"something:else:number:whatever:still"')).toBe("else")
  })
})
