/**
 * @jest-environment node
 */

const { onCreateNode, onPreBootstrap } = require("./gatsby-node")
const { createRemoteFileNode } = require("gatsby-source-filesystem")

jest.mock("gatsby-source-filesystem")

require("jest-fetch-mock").enableMocks()

const contentDigest = "some content digest"
const createNode = jest.fn()
const createNodeId = jest.fn().mockImplementation(id => id)
const createContentDigest = jest.fn().mockReturnValue(contentDigest)
createRemoteFileNode.mockReturnValue({ absolutePath: "/hi/there/path.ext" })

const actions = { createNode }
const internal = { type: "Extension" }

describe("the github data handler", () => {
  describe("for an extension with no scm information", () => {
    const metadata = {}

    const node = {
      metadata,
      internal,
    }

    beforeAll(async () => {
      await onPreBootstrap({ actions: {} })
      // Don't count what the pre bootstrap does in our checking
      fetch.resetMocks()
      return onCreateNode({
        node,
        createContentDigest,
        createNodeId,
        actions,
      })
    })

    afterAll(() => {
      fetch.resetMocks()
    })

    it("changes nothing", async () => {
      expect(node.metadata).toEqual({})
      expect(node.metadata.sourceControl).toBeUndefined()
    })

    it("does no remote calls", async () => {
      expect(fetch).not.toHaveBeenCalled()
    })
  })

  describe("for an extension with a scm-url", () => {
    const projectName = "somerepo"
    const ownerName = "someuser"
    const url = "http://fake.github.com/someuser/" + projectName
    const issuesUrl = url + "/issues"
    const avatarUrl = "http://something.com/someuser.png"
    const socialMediaPreviewUrl =
      "https://testopengraph.githubassets.com/3096043220541a8ea73deb5cb6baddf0f01d50244737d22402ba12d665e9aec2/quarkiverse/quarkus-some-extension"

    const gitHubData = {
      json: jest.fn().mockResolvedValue({
        data: {
          repository: {
            issues: {
              totalCount: 16,
            },
            defaultBranchRef: { name: "unusual" },
            metaInfs: null,
            subfolderMetaInfs: null,
            shortenedSubfolderMetaInfs: {
              entries: [
                { path: "runtime/src/main/resources/META-INF/beans.xml" },
                {
                  path: "some-folder-name/runtime/src/main/resources/META-INF/quarkus-extension.yaml",
                },
                { path: "runtime/src/main/resources/META-INF/services" },
              ],
            },
            openGraphImageUrl: socialMediaPreviewUrl,
          },
          repositoryOwner: { avatarUrl: avatarUrl },
        },
      }),
    }
    const metadata = {
      maven: { artifactId: "something", groupId: "grouper" },
      sourceControl: `${url},mavenstuff`,
    }

    const node = {
      metadata,
      internal,
    }

    beforeAll(async () => {
      // Needed so that we do not short circuit the git path
      process.env.GITHUB_TOKEN = "test_value"
      fetch.mockResolvedValue(gitHubData)
      await onPreBootstrap({ actions: {} })
      return onCreateNode({
        node,
        createContentDigest,
        createNodeId,
        actions,
      })
    })

    afterAll(() => {
      delete process.env.GITHUB_TOKEN
      fetch.resetMocks()
    })

    it("creates an scm node", async () => {
      expect(createNode).toHaveBeenCalled()
    })

    it("creates a content digest", async () => {
      // internal.contentDigest
      expect(createContentDigest).toHaveBeenCalled()
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          internal: expect.objectContaining({ contentDigest }),
        })
      )
    })

    it("sets the type", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          internal: expect.objectContaining({ type: "SourceControlInfo" }),
        })
      )
    })

    it("sets an id", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          id: `${url},mavenstuff`,
        })
      )
    })

    it("copies across the url", async () => {
      expect(createNode).toHaveBeenCalledWith(expect.objectContaining({ url }))
    })

    it("fills in an issues url", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({ issuesUrl })
      )
    })

    it("fills in an image with the owner avatar", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({ ownerImageUrl: avatarUrl })
      )
    })

    it("fills in a project name", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({ project: projectName })
      )
    })

    it("fills in the owner name", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({ owner: ownerName })
      )
    })

    it("fills in an issue count", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({ issues: 16 })
      )
    })

    it("does not populate a label", async () => {
      expect(createNode).not.toHaveBeenCalledWith(
        expect.objectContaining({ labels: expect.anything() })
      )
      expect(createNode).not.toHaveBeenCalledWith(
        expect.objectContaining({ label: expect.anything() })
      )
    })

    it("fills in a url for the extension yaml", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          extensionYamlUrl:
            "http://fake.github.com/someuser/somerepo/blob/unusual/some-folder-name/runtime/src/main/resources/META-INF/quarkus-extension.yaml",
        })
      )
    })

    it("invokes the github graphql api", async () => {
      expect(fetch).toHaveBeenCalled()
      expect(fetch).toHaveBeenCalledWith(
        "https://api.github.com/graphql",
        expect.objectContaining({
          // This is a bit fragile with the assumptions about whitespace and a bit fiddly with the slashes, but it checks we did a query and got the project name right
          body: expect.stringMatching(/name:\\"somerepo\\"/),
        })
      )
    })

    it("does not create any nodes", async () => {
      expect(createRemoteFileNode).not.toHaveBeenCalled()
    })
  })

  describe("where a label should be used", () => {
    const projectName = "somerepo"
    const ownerName = "someuser"
    const url = "https://github.com/quarkusio/quarkus"
    const issuesUrl =
      url +
      "/issues?q=is%3Aopen+is%3Aissue+label%3Aarea%2Falabel,area%2Fanotherlabel"
    const avatarUrl = "http://something.com/someuser.png"
    const socialMediaPreviewUrl =
      "https://testopengraph.githubassets.com/3096043220541a8ea73deb5cb6baddf0f01d50244737d22402ba12d665e9aec2/quarkiverse/quarkus-some-extension"

    const labels = ["area/alabel", "area/anotherlabel"]
    const yaml = `triage:
 rules:
  - id: amazon-lambda
    labels: [ area/alabel, area/anotherlabel ]
    directories:
      - extensions/something
      - integration-tests/amazon-lambda`

    const gitHubData = {
      text: jest.fn().mockResolvedValue(yaml),
      json: jest.fn().mockResolvedValue({
        data: {
          repository: {
            issues: {
              totalCount: 16,
            },
            defaultBranchRef: { name: "unusual" },
            metaInfs: null,
            subfolderMetaInfs: null,
            shortenedSubfolderMetaInfs: {
              entries: [
                { path: "runtime/src/main/resources/META-INF/beans.xml" },
                {
                  path: "some-folder-name/runtime/src/main/resources/META-INF/quarkus-extension.yaml",
                },
                { path: "runtime/src/main/resources/META-INF/services" },
              ],
            },
            openGraphImageUrl: socialMediaPreviewUrl,
          },
          repositoryOwner: { avatarUrl: avatarUrl },
        },
      }),
    }
    const metadata = {
      maven: { artifactId: "something", groupId: "group" },
      sourceControl: `${url},otherstuff`,
    }

    const node = {
      metadata,
      internal,
    }

    beforeAll(async () => {
      // Needed so that we do not short circuit the git path
      process.env.GITHUB_TOKEN = "test_value"
      fetch.mockResolvedValue(gitHubData)
      await onPreBootstrap({ actions: {} })
      return onCreateNode({
        node,
        createContentDigest,
        createNodeId,
        actions,
      })
    })

    afterAll(() => {
      delete process.env.GITHUB_TOKEN
      fetch.resetMocks()
    })

    it("creates an scm node", async () => {
      expect(createNode).toHaveBeenCalled()
    })

    it("creates a content digest", async () => {
      // internal.contentDigest
      expect(createContentDigest).toHaveBeenCalled()
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          internal: expect.objectContaining({ contentDigest }),
        })
      )
    })

    it("sets the type", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          internal: expect.objectContaining({ type: "SourceControlInfo" }),
        })
      )
    })

    it("sets an id", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          id: `${url},otherstuff`,
        })
      )
    })

    it("copies across the url", async () => {
      expect(createNode).toHaveBeenCalledWith(expect.objectContaining({ url }))
    })

    it("fills in an issues url", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({ issuesUrl })
      )
    })

    it("fills in an image with the owner avatar", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({ ownerImageUrl: avatarUrl })
      )
    })

    it("fills in a project name", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({ project: projectName })
      )
    })

    it("fills in the owner name", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({ owner: ownerName })
      )
    })

    it("fills in an issue count", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({ issues: 16 })
      )
    })

    it("fills in a label", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({ labels })
      )
    })

    it("fills in a url for the extension yaml", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          extensionYamlUrl:
            "http://fake.github.com/someuser/somerepo/blob/unusual/some-folder-name/runtime/src/main/resources/META-INF/quarkus-extension.yaml",
        })
      )
    })

    it("invokes the github graphql api", async () => {
      expect(fetch).toHaveBeenCalled()
      expect(fetch).toHaveBeenCalledWith(
        "https://api.github.com/graphql",
        expect.objectContaining({
          // This is a bit fragile with the assumptions about whitespace and a bit fiddly with the slashes, but it checks we did a query and got the project name right
          body: expect.stringMatching(/name:\\"quarkus\\"/),
        })
      )
    })
  })

  describe("where the social media preview has been set by the user", () => {
    const url = "http://fake.github.com/someuser/aproject"

    const avatarUrl = "http://something.com/someuser.png"
    const socialMediaPreviewUrl =
      "https://repository-images.githubusercontent.com/437045322/39ad4dec-e606-4b21-bb24-4c09a4790b58"

    const gitHubData = {
      json: jest.fn().mockResolvedValue({
        data: {
          repository: {
            issues: {
              totalCount: 10,
            },
            openGraphImageUrl: socialMediaPreviewUrl,
          },
          repositoryOwner: { avatarUrl: avatarUrl },
        },
      }),
    }

    const metadata = {
      sourceControl: `${url},uniquenessstuff`,
    }

    const node = {
      metadata,
      internal,
    }

    beforeAll(async () => {
      // Needed so that we do not short circuit the git path
      process.env.GITHUB_TOKEN = "social-preview-test_value"
      fetch.mockResolvedValue(gitHubData)
      await onPreBootstrap({ actions: {} })
      return onCreateNode({
        node,
        createContentDigest,
        createNodeId,
        actions,
      })
    })

    afterAll(() => {
      delete process.env.GITHUB_TOKEN
      fetch.resetMocks()
    })

    it("creates a new file node with the cropped image", async () => {
      expect(createRemoteFileNode).toHaveBeenCalledWith(
        expect.objectContaining({ url: socialMediaPreviewUrl })
      )
    })
  })
})
