import { extensionSlug } from "./extension-slugger"

describe("extension url generator", () => {
  it("handles arbitrary strings", () => {
    expect(extensionSlug("Marshmallows")).toBe("marshmallows")
  })

  it("handles spaces", () => {
    expect(extensionSlug("some string")).toBe("some-string")
  })

  it("handles non-platform platforms", () => {
    expect(extensionSlug("io.quarkus:my.nice.id:2.0.7:json:1.0-SNAPSHOT")).toBe(
      "io-quarkus_my-nice-id"
    )
  })

  it("handles arbitrary GAVs", () => {
    expect(extensionSlug("something:else:number:whatever:still")).toBe(
      "something_else"
    )
  })

  it("lower cases urls", () => {
    expect(extensionSlug("Something:else:number:whatever:still")).toBe(
      "something_else"
    )
  })
})
