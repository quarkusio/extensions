const { createMavenUrlFromCoordinates } = require("./maven-url")
jest.mock("./maven-url")

const resolvedMavenUrl = "http://some.url.mvn"
createMavenUrlFromCoordinates.mockImplementation(coordinates =>
  coordinates ? resolvedMavenUrl : undefined
)

import { generateMavenInfo } from "./maven-info"

describe("the maven information generator", () => {
  const artifact = "io.quarkus:quarkus-vertx::jar:3.0.0.Alpha1"

  it("adds a maven url", async () => {
    const mavenInfo = await generateMavenInfo(artifact)
    expect(mavenInfo.url).toBe(resolvedMavenUrl)
  })

  it("adds a version", async () => {
    const mavenInfo = await generateMavenInfo(artifact)
    expect(mavenInfo.version).toBe("3.0.0.Alpha1")
  })
})
