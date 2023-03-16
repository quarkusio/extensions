import { labelExtractor } from "./labelExtractor"
import { readFile } from "fs/promises"

const testDataYaml = readFile("__mocks__/test-data/quarkus-github-bot.yml")

describe("the github label extractor", () => {
  it("gracefully handles nulls", async () => {
    const extensionArtifactId = "quarkus-resteasy-jackson"
    const extractor = labelExtractor(undefined)
    expect(extractor.getLabels(extensionArtifactId)).toBeUndefined()
  })

  it("gracefully handles empty data", async () => {
    const extensionArtifactId = "quarkus-resteasy-jackson"
    const extractor = labelExtractor("")
    expect(extractor.getLabels(extensionArtifactId)).toBeUndefined()
  })

  it("can get an extension's label in the simple case, with a trailing slash in the path", async () => {
    const extensionArtifactId = "quarkus-resteasy-jackson"
    const extractor = labelExtractor(await testDataYaml)
    expect(extractor.getLabels(extensionArtifactId)).toStrictEqual([
      "area/resteasy",
    ])
  })

  it("can get an extension's label in the simple case, with no trailing slash", async () => {
    const extensionArtifactId = "hibernate-search"
    const extractor = labelExtractor(await testDataYaml)
    expect(extractor.getLabels(extensionArtifactId)).toStrictEqual([
      "area/hibernate-search",
    ])
  })

  // TODO this should also match sibling paths, but do that in a second change

  it("can more than one label where more than one is defined", async () => {
    const extensionArtifactId = "quarkus-hibernate-reactive"
    const extractor = labelExtractor(await testDataYaml)
    expect(extractor.getLabels(extensionArtifactId)).toStrictEqual([
      "area/hibernate-reactive",
      "area/persistence",
    ])
  })
})
