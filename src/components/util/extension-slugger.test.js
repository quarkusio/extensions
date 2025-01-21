import { extensionSlug, slugForExtensionsAddedMonth, slugForExtensionsAddedYear } from "./extension-slugger"

describe("extension url generator", () => {
  it("handles arbitrary strings", () => {
    expect(extensionSlug("Marshmallows")).toBe("marshmallows")
  })

  it("handles spaces", () => {
    expect(extensionSlug("some string")).toBe("some-string")
  })

  it("handles non-platform platforms", () => {
    expect(extensionSlug("io.quarkus:my-nice-id:2.0.7:json:1.0-SNAPSHOT")).toBe(
      "io.quarkus/my-nice-id"
    )
  })

  it("handles arbitrary GAVs", () => {
    expect(extensionSlug("something:else:number:whatever:still")).toBe(
      "something/else"
    )
  })

  it("lower cases urls", () => {
    expect(extensionSlug("Something:else:number:whatever:still")).toBe(
      "something/else"
    )
  })

  it("turns undefined extension months into a root url", () => {
    expect(slugForExtensionsAddedMonth()).toBe(
      "new-extensions/"
    )
  })

  it("turns extension months into a url with the month", () => {
    expect(slugForExtensionsAddedMonth("487592268000")).toBe(
      "new-extensions/1985/june"
    )
  })

  it("turns extension months into a url with just the year", () => {
    expect(slugForExtensionsAddedYear("487592268000")).toBe(
      "new-extensions/1985"
    )
  })
})
