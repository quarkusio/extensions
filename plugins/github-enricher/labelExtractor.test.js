import { labelExtractor } from "./labelExtractor"
import { readFile } from "fs/promises"

const testDataYaml = readFile("__mocks__/test-data/quarkus-github-bot.yml")

describe("the github label extractor", () => {
  it("gracefully handles nulls", async () => {
    const extensionArtifactId = "quarkus-expected-failure"
    const extractor = labelExtractor(undefined)
    expect(extractor.getLabels(extensionArtifactId)).toBeUndefined()
  })

  it("gracefully handles empty data", async () => {
    const extensionArtifactId = "quarkus-expected-failure"
    const extractor = labelExtractor("")
    expect(extractor.getLabels(extensionArtifactId)).toBeUndefined()
  })

  it("gracefully handles unknown extensions", async () => {
    const extensionArtifactId = "quarkus-expected-failure"
    const extractor = labelExtractor(await testDataYaml)
    expect(extractor.getLabels(extensionArtifactId)).toBeUndefined()
  })

  it("can get an extension's label in the simple case, with a trailing slash in the path", async () => {
    const extensionArtifactId = "quarkus-resteasy-jackson"
    const extractor = labelExtractor(await testDataYaml)
    expect(extractor.getLabels(extensionArtifactId)).toStrictEqual([
      "area/resteasy",
    ])
  })

  it("does not return labels for siblings if there is a trailing slash in the path", async () => {
    const extensionArtifactId = "quarkus-resteasy-jackson-some-variant"
    const extractor = labelExtractor(await testDataYaml)
    expect(extractor.getLabels(extensionArtifactId)).toBeUndefined()
  })

  it("can get an extension's label in the simple case, with no trailing slash", async () => {
    const extensionArtifactId = "hibernate-search"
    const extractor = labelExtractor(await testDataYaml)
    expect(extractor.getLabels(extensionArtifactId)).toStrictEqual([
      "area/hibernate-search",
    ])
  })

  it("can get an extension's label in the case where the path is a root, with no trailing slash", async () => {
    const extensionArtifactId = "hibernate-search-some-qualifier"
    const extractor = labelExtractor(await testDataYaml)
    expect(extractor.getLabels(extensionArtifactId)).toStrictEqual([
      "area/hibernate-search",
    ])
  })

  it("returns more than one label where more than one is defined", async () => {
    const extensionArtifactId = "quarkus-hibernate-reactive"
    const extractor = labelExtractor(await testDataYaml)
    expect(extractor.getLabels(extensionArtifactId)).toStrictEqual([
      "area/hibernate-reactive",
      "area/persistence",
    ])
  })

  it("merges labels where more than one rule applies to an extension", async () => {
    const extensionArtifactId = "quarkus-reactive-db2-client"
    const extractor = labelExtractor(await testDataYaml)
    expect(extractor.getLabels(extensionArtifactId)).toStrictEqual([
      "area/persistence",
      "area/reactive-sql-clients",
    ])
  })
})
