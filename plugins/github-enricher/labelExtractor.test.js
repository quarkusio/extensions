import { labelExtractor } from "./labelExtractor"
import { readFile } from "fs/promises"

const testDataYaml = readFile("__mocks__/test-data/quarkus-github-bot.yml")
// eslint-disable-next-line jest/no-mocks-import
const repoListing = require("../../__mocks__/test-data/quarkus-repo-listing-from-graphql.json")

describe("the github label extractor", () => {
  it("gracefully handles nulls", async () => {
    const extensionArtifactId = "quarkus-expected-failure"
    const extractor = labelExtractor(undefined, repoListing)
    expect(extractor.getLabels(extensionArtifactId)).toBeUndefined()
  })

  it("gracefully handles empty data", async () => {
    const extensionArtifactId = "quarkus-expected-failure"
    const extractor = labelExtractor("", repoListing)
    expect(extractor.getLabels(extensionArtifactId)).toBeUndefined()
  })

  it("gracefully handles empty repository listings", async () => {
    const extensionArtifactId = "quarkus-resteasy-jackson"
    const extractor = labelExtractor(testDataYaml, undefined)
    expect(extractor.getLabels(extensionArtifactId)).toBeUndefined()
  })

  describe("for typical data", () => {
    let extractor
    beforeAll(async () => {
      extractor = labelExtractor(await testDataYaml, repoListing)
    })

    it("does not assign labels to arbitrary folders in our repository hierarchy", () => {
      expect(extractor.getLabels("api")).toBeUndefined()
      expect(extractor.getLabels("spi")).toBeUndefined()
      expect(extractor.getLabels("deployment")).toBeUndefined()
      expect(extractor.getLabels("runtime")).toBeUndefined()
    })

    it("can get an extension's label in the simple case, with a trailing slash in the path", () => {
      const extensionArtifactId = "quarkus-resteasy-jackson"
      expect(extractor.getLabels(extensionArtifactId)).toStrictEqual([
        "area/resteasy",
      ])
    })

    it("does not return labels for siblings if there is a trailing slash in the path", () => {
      const extensionArtifactId = "quarkus-resteasy-jackson-some-variant"
      expect(extractor.getLabels(extensionArtifactId)).toBeUndefined()
    })

    it("can get an extension's label in the simple case, with no trailing slash", () => {
      const extensionArtifactId = "hibernate-search"
      expect(extractor.getLabels(extensionArtifactId)).toStrictEqual([
        "area/hibernate-search",
      ])
    })

    it("can get an extension's label in the case where the path is a root, with no trailing slash", () => {
      const extensionArtifactId = "hibernate-search-some-qualifier"
      expect(extractor.getLabels(extensionArtifactId)).toStrictEqual([
        "area/hibernate-search",
      ])
    })

    it("returns more than one label where more than one is defined", () => {
      const extensionArtifactId = "quarkus-hibernate-reactive"
      expect(extractor.getLabels(extensionArtifactId)).toStrictEqual([
        "area/hibernate-reactive",
        "area/persistence",
      ])
    })

    it("can get an extension's label in the case where the path points to a parent folder", () => {
      const extensionArtifactId = "funqy-knative-events"
      expect(extractor.getLabels(extensionArtifactId)).toStrictEqual([
        "area/funqy",
      ])
    })

    it("can get an extension's label in the case where the rule includes several directory levels", () => {
      const extensionArtifactId = "quarkus-jdbc-db2"
      expect(extractor.getLabels(extensionArtifactId)).toStrictEqual([
        "area/persistence",
      ])
    })

    it("merges labels where more than one rule applies to an extension", () => {
      const extensionArtifactId = "quarkus-reactive-db2-client"
      expect(extractor.getLabels(extensionArtifactId)).toStrictEqual([
        "area/persistence",
        "area/reactive-sql-clients",
      ])
    })
  })
})
