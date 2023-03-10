import {
  getPlatformId,
  getStream,
  prettyPlatformName,
  qualifiedPrettyPlatform,
} from "./pretty-platform"

describe("platform name formatter", () => {
  it("handles arbitrary strings", () => {
    expect(prettyPlatformName("marshmallows")).toBe("Marshmallows")
  })

  it("handles nulls", () => {
    expect(prettyPlatformName()).toBe()
  })

  it("handles non-platform platforms", () => {
    expect(prettyPlatformName("quarkus-non-platform-extensions")).toBe("Other")
  })

  it("handles quarkus core", () => {
    expect(prettyPlatformName("quarkus-bom-quarkus-platform-descriptor")).toBe(
      "Quarkus"
    )
  })

  it("handles ecosystem platforms", () => {
    expect(
      prettyPlatformName("quarkus-camel-bom-quarkus-platform-descriptor")
    ).toBe("Camel")
  })

  it("handles ecosystem platforms which do not mention bom", () => {
    expect(
      prettyPlatformName("quarkus-hazelcast-client-quarkus-platform-descriptor")
    ).toBe("Hazelcast Client")
  })

  it("handles ecosystem platforms with unusual casing", () => {
    expect(
      prettyPlatformName("quarkus-qpid-jms-bom-quarkus-platform-descriptor")
    ).toBe("Qpid JMS")
  })
})

describe("qualified name maker", () => {
  it("handles ecosystem platforms", () => {
    expect(
      qualifiedPrettyPlatform(
        "io.quarkus.platform:quarkus-camel-bom-quarkus-platform-descriptor:quarkus-bom-quarkus-platform-descriptor:2.16.3.Final:json:2.16.3.Final"
      )
    ).toBe("io.quarkus.platform:Camel")
  })

  it("handles arbitrary strings", () => {
    expect(
      qualifiedPrettyPlatform(
        "io.quarkus.platform:marshmallows:2.0.7:json:1.0-SNAPSHOT"
      )
    ).toBe("io.quarkus.platform:Marshmallows")
  })

  it("handles non-platform platforms", () => {
    expect(
      qualifiedPrettyPlatform(
        "io.quarkus.registry:quarkus-non-platform-extensions:2.0.7:json:1.0-SNAPSHOT"
      )
    ).toBe("Other")
  })
})

describe("platform id extractor", () => {
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

describe("stream extractor", () => {
  // A cut down version of what the registry returns us, with just the relevant bits
  const currentPlatforms = [
    {
      "platform-key": "io.quarkus.platform",
      name: "Quarkus Community Platform",
      streams: [
        {
          id: "2.16",
        },
        {
          id: "2.15",
        },
        {
          id: "2.13",
        },
        {
          id: "3.0",
        },
      ],
      "current-stream-id": "2.16",
    },
  ]

  it("handles arbitrary strings without exploding", () => {
    expect(getStream("marshmallows")).toBeUndefined()
  })

  it("handles nulls", () => {
    expect(getStream()).toBeUndefined()
  })

  it("extracts the stream for an origin", () => {
    expect(
      getStream(
        "io.quarkus.platform:quarkus-bom-quarkus-platform-descriptor:2.15.0:json:2.15.0",
        currentPlatforms
      )
    ).toEqual(
      expect.objectContaining({
        platformKey: "io.quarkus.platform",
        id: "2.15",
      })
    )
  })

  it("gets the correct is-current status for an origin", () => {
    expect(
      getStream(
        "io.quarkus.platform:quarkus-bom-quarkus-platform-descriptor:2.15.0:json:2.15.0",
        currentPlatforms
      ).isLatestThree
    ).toBe(true)
  })

  it("extracts the stream for an origin with an alpha qualifier", () => {
    expect(
      getStream(
        "io.quarkus.platform:quarkus-bom-quarkus-platform-descriptor:3.0.0.Alpha3:json:3.0.0.Alpha3",
        currentPlatforms
      )
    ).toEqual({
      platformKey: "io.quarkus.platform",
      id: "3.0",
      isLatestThree: true,
    })
  })

  it("marks the stream as obsolete if it is not in the latest three platforms", () => {
    expect(
      getStream(
        "io.quarkus.platform:quarkus-bom-quarkus-platform-descriptor:1.2.3:json:1.2.3",
        currentPlatforms
      )
    ).toEqual({
      platformKey: "io.quarkus.platform",
      id: "1.2",
      isLatestThree: false,
    })
  })
})
