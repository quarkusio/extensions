/**
 * @jest-environment node
 */

const { onCreateNode, onPreBootstrap, onPluginInit, sourceNodes, createResolvers } = require("./gatsby-node")
const { createRemoteFileNode } = require("gatsby-source-filesystem")
const { queryGraphQl, getRawFileContents, queryRest } = require("./github-helper")
const { getContributors } = require("./sponsorFinder")
const { createRepository } = require("./repository-creator")

jest.mock("gatsby-source-filesystem")
jest.mock("./github-helper")
jest.mock("./repository-creator")
jest.mock("./sponsorFinder", () => ({
  ...jest.requireActual("./sponsorFinder"),
  getContributors: jest.fn(),
}))

const contentDigest = "some content digest"
const createNode = jest.fn()
const createNodeId = jest.fn().mockImplementation(id => id)
const createContentDigest = jest.fn().mockReturnValue(contentDigest)

const actions = { createNode }
const internal = { type: "Extension" }

const cache = { get: jest.fn() }

describe("the github data handler", () => {
  beforeAll(() => {
    createRemoteFileNode.mockReturnValue({ absolutePath: "/hi/there/path.ext" })

    // Suppress the chatter about caching
    jest.spyOn(console, "log").mockImplementation(() => {
    })
  })

  afterAll(() => {
    jest.resetAllMocks()
  })

  describe("for an extension with no scm information", () => {
    const metadata = {}

    const node = {
      metadata,
      internal,
    }

    beforeAll(async () => {
      queryGraphQl.mockResolvedValue({})

      await onPreBootstrap({ cache, actions: {} })
      // Don't count what the pre bootstrap does in our checking
      jest.clearAllMocks()
      return onCreateNode({
        node,
        createContentDigest,
        createNodeId,
        actions,
      })
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    it("changes nothing", async () => {
      expect(node.metadata).toEqual({})
      expect(node.metadata.sourceControl).toBeUndefined()
    })

    it("does no remote calls", async () => {
      expect(queryGraphQl).not.toHaveBeenCalled()
      expect(queryRest).not.toHaveBeenCalled()
      expect(getRawFileContents).not.toHaveBeenCalled()
    })


    it("does not creates a repository node", async () => {
      expect(createRepository).not.toHaveBeenCalled()
    })

  })

  describe("for an extension with an explicit sponsor listed", () => {
    const sponsor = "Big Company Inc"
    const metadata = { sponsor }

    const node = {
      metadata,
      internal,
    }

    beforeAll(async () => {
      queryGraphQl.mockResolvedValue({})

      await onPreBootstrap({ cache, actions: {} })
      // Don't count what the pre bootstrap does in our checking
      jest.clearAllMocks()
      return onCreateNode({
        node,
        createContentDigest,
        createNodeId,
        actions,
      })
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    it("creates a contributing company node", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          name: sponsor,
          source: "metadata-sponsor"
        })
      )
    })

    it("creates a contributing company node with a suitable type", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          internal: expect.objectContaining({ type: "ContributingCompany" }),
        })
      )
    })

    it("creates a contributing company node with a meaningful id", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          id: sponsor,
        })
      )
    })

    it("creates a contributing company node with a proper content digest", async () => {
      expect(createContentDigest).toHaveBeenCalled()
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          internal: expect.objectContaining({ contentDigest }),
        })
      )
    })
  })

  describe("for an extension with a scm-url", () => {
    const projectName = "somerepo"
    const ownerName = "someuser"
    const url = "http://fake.github.com/someuser/" + projectName
    const otherUrl = "http://fake.github.com/someuser/other" + projectName
    const issuesUrl = url + "/issues"
    const avatarUrl = "http://something.com/someuser.png"
    const socialMediaPreviewUrl =
      "https://testopengraph.githubassets.com/3096043220541a8ea73deb5cb6baddf0f01d50244737d22402ba12d665e9aec2/quarkiverse/quarkus-some-extension"

    const response = {
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
    }

    const metadata = {
      maven: { artifactId: "something", groupId: "grouper" },
      sourceControl: `${url},mavenstuff`,
    }

    const node = {
      metadata,
      internal,
    }

    const otherMetadata = {
      maven: { artifactId: "something", groupId: "grouper" },
      sourceControl: `${otherUrl},mavenstuff`,
    }

    const otherNode = {
      metadata: otherMetadata,
      internal,
    }

    beforeAll(async () => {
      queryGraphQl.mockResolvedValue(response)
      getContributors.mockResolvedValue({ contributors: [{ name: "someone" }], lastUpdated: Date.now() })
      await onPreBootstrap({ cache, actions: {} })
    })

    beforeEach(async () => {
      // Clear the cache
      onPluginInit()

      // Needed so that we do not short circuit the git path
      return onCreateNode({
        node,
        createContentDigest,
        createNodeId,
        actions,
      })
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it("creates an scm node", async () => {
      expect(createNode).toHaveBeenCalled()
    })

    it("creates a content digest", async () => {
      expect(createContentDigest).toHaveBeenCalled()
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          internal: expect.objectContaining({ contentDigest }),
        })
      )
    })


    it("creates a repository node", async () => {
      expect(createRepository).toHaveBeenCalledWith(expect.anything(),
        expect.objectContaining({
          url: url,
          project: projectName,
          owner: ownerName
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
      expect(createNode).toHaveBeenCalledWith(expect.objectContaining({ repository: url }))
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


    it("fills in an issue count", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({ issues: 16 })
      )
    })

    it("fills in last updated information", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({ lastUpdated: expect.anything() })
      )
    })

    it("fills in contributor information", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({ contributorsWithFullCompanyInfo: expect.arrayContaining([expect.anything()]) })
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

    it("fills in a path for the extension", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          extensionPathInRepo:
            "some-folder-name/",
        })
      )
    })

    it("fills in a url for the extension", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          extensionRootUrl:
            "http://fake.github.com/someuser/somerepo/blob/unusual/some-folder-name/",
        })
      )
    })

    it("invokes the github graphql api", async () => {
      expect(queryGraphQl).toHaveBeenCalled()
      expect(queryGraphQl).toHaveBeenCalledWith(
        // This is a bit fragile with the assumptions about whitespace and a bit fiddly with the slashes, but it checks we did a query and got the project name right
        expect.stringMatching(/name: ?\"somerepo\"/),
      )
    })

    it("caches the issue count", async () => {
      expect(queryGraphQl).toHaveBeenCalledWith(expect.stringMatching(/issues\(states:OPEN/))

      // Reset call counts and histories, since the code may not even do a query
      jest.clearAllMocks()

      // Now re-trigger the invocation
      await onCreateNode(
        {
          node,
          createContentDigest,
          createNodeId,
          actions,
        },
        {}
      )

      // But it should not ask for the issues
      expect(queryGraphQl).not.toHaveBeenCalledWith(expect.stringMatching(/issues\(states:OPEN/))

      // It should set an issue count, even though it didn't ask for one
      expect(createNode).toHaveBeenLastCalledWith(
        expect.objectContaining({ issues: 16 })
      )
    })

    it("caches the top-level quarkus-extension.yaml", async () => {
      expect(queryGraphQl).toHaveBeenCalledWith(expect.stringMatching(
          /HEAD:runtime\/src\/main\/resources\/META-INF/
        )
      )

      // Reset call counts and histories, since the code may not even do a query
      jest.clearAllMocks()

      // Now re-trigger the invocation
      await onCreateNode(
        {
          node,
          createContentDigest,
          createNodeId,
          actions,
        },
        {}
      )

      // But it should not ask for the top-level meta-inf listing
      expect(queryGraphQl).not.toHaveBeenCalledWith(
        expect.stringMatching(/HEAD:runtime\/src\/main\/resources\/META-INF/),
      )

      // It should set an extension descriptor path, even though it didn't ask for one
      expect(createNode).toHaveBeenLastCalledWith(
        expect.objectContaining({
          extensionYamlUrl:
            url +
            "/blob/unusual/some-folder-name/runtime/src/main/resources/META-INF/quarkus-extension.yaml",
          extensionPathInRepo:
            "some-folder-name/",
        })
      )

      // It should fill in the cached information for everything else
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerImageUrl: "http://something.com/someuser.png",
        })
      )
    })

    it("caches the quarkus-extension.yaml in subfolders", async () => {
      // Sense check of what happened in beforeEach
      expect(queryGraphQl).toHaveBeenCalledWith(
        expect.stringMatching(
          /HEAD:something\/runtime\/src\/main\/resources\/META-INF/
        ),
      )

      // Reset call counts and histories, since the code may not even do a query
      jest.clearAllMocks()
      // Now re-trigger the invocation
      await onCreateNode(
        {
          node,
          createContentDigest,
          createNodeId,
          actions,
        },
        {}
      )

      // And it should not ask for the subfolder meta-inf listing
      // It possibly won't ask for anything at all
      expect(queryGraphQl).not.toHaveBeenCalledWith(
        expect.stringMatching(
          /HEAD:something\/runtime\/src\/main\/resources\/META-INF/
        ),
      )

      // It should set an extension descriptor path and extension path
      expect(createNode).toHaveBeenLastCalledWith(
        expect.objectContaining({
          extensionYamlUrl:
            url +
            "/blob/unusual/some-folder-name/runtime/src/main/resources/META-INF/quarkus-extension.yaml",
        })
      )
    })

    it("does not cache the issue count on a subsequent call for a different project", async () => {
      // Re-trigger the invocation
      const newIssueCount = 56
      response.data.repository.issues.totalCount = newIssueCount

      await onCreateNode(
        {
          node: otherNode,
          createContentDigest,
          createNodeId,
          actions,
        },
        {}
      )

      expect(queryGraphQl).toHaveBeenCalledWith(
        expect.stringMatching(/issues\(states:OPEN/),
      )

      expect(createNode).toHaveBeenLastCalledWith(
        expect.objectContaining({ issues: newIssueCount })
      )
    })

    it("does not create any remote file nodes", async () => {
      expect(createRemoteFileNode).not.toHaveBeenCalled()
    })

    describe("where the scm-url ends with .git", () => {

      const url = "http://phony.github.com/thing.git"

      const response = {
        data: {
          repository: {
            issues: {
              totalCount: 16,
            },
            defaultBranchRef: { name: "unusual" },
          },
          repositoryOwner: { avatarUrl: avatarUrl },
        },
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
        queryGraphQl.mockResolvedValue(response)
        getContributors.mockResolvedValue({ contributors: [{ name: "someone" }], lastUpdated: Date.now() })
        await onPreBootstrap({ cache, actions: {} })
      })

      beforeEach(async () => {
        // Clear the cache
        onPluginInit()

        // Needed so that we do not short circuit the git path
        return onCreateNode({
          node,
          createContentDigest,
          createNodeId,
          actions,
        })
      })

      afterAll(() => {
        jest.clearAllMocks()
      })

      afterEach(() => {
        jest.clearAllMocks()
      })

      it("fills in an issues url", async () => {
        expect(createNode).toHaveBeenCalledWith(
          expect.objectContaining({ issuesUrl: "http://phony.github.com/thing/issues" })
        )
      })

    })

    describe("where the scm-url is a gitbox url", () => {

      const url = "https://gitbox.apache.org/repos/asf?p=camel-quarkus.git;a=summary"
      const expectedUrl = "https://github.com/apache/camel-quarkus"

      const response = {
        data: {
          repository: {
            issues: {
              totalCount: 16,
            },
            defaultBranchRef: { name: "unusual" },
          },
          repositoryOwner: { avatarUrl: avatarUrl },
        },
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
        queryGraphQl.mockResolvedValue(response)
        getContributors.mockResolvedValue({ contributors: [{ name: "someone" }], lastUpdated: Date.now() })
        await onPreBootstrap({ cache, actions: {} })
      })

      beforeEach(async () => {
        // Clear the cache
        onPluginInit()

        // Needed so that we do not short circuit the git path
        return onCreateNode({
          node,
          createContentDigest,
          createNodeId,
          actions,
        })
      })

      afterAll(() => {
        jest.clearAllMocks()
      })

      afterEach(() => {
        jest.clearAllMocks()
      })

      it("adjusts the scm url", async () => {
        expect(createNode).toHaveBeenCalledWith(
          expect.objectContaining({ repository: expectedUrl })
        )
      })

      it("fills in an issues url", async () => {
        expect(createNode).toHaveBeenCalledWith(
          expect.objectContaining({ issuesUrl: `${expectedUrl}/issues` })
        )
      })

    })
  })

  describe("for an extension with a scm-url with a trailing slash", () => {
    const projectName = "somerepo"
    const ownerName = "someuser"
    const url = "http://fake.github.com/someuser/" + projectName + "/"
    const otherUrl = "http://fake.github.com/someuser/other" + projectName
    const issuesUrl = "http://fake.github.com/someuser/somerepo/issues"
    const avatarUrl = "http://something.com/someuser.png"
    const socialMediaPreviewUrl =
      "https://testopengraph.githubassets.com/3096043220541a8ea73deb5cb6baddf0f01d50244737d22402ba12d665e9aec2/quarkiverse/quarkus-some-extension"

    const response = {
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
          samples: {
            entries: [
              { path: "some-other-path/samples" }
            ]
          },
          openGraphImageUrl: socialMediaPreviewUrl,
        },
        repositoryOwner: { avatarUrl: avatarUrl },
      },
    }

    const metadata = {
      maven: { artifactId: "something", groupId: "grouper" },
      sourceControl: `${url},mavenstuff`,
    }

    const node = {
      metadata,
      internal,
    }

    const otherMetadata = {
      maven: { artifactId: "something", groupId: "grouper" },
      sourceControl: `${otherUrl},mavenstuff`,
    }

    const otherNode = {
      metadata: otherMetadata,
      internal,
    }

    beforeAll(async () => {
      queryGraphQl.mockResolvedValue(response)
      getContributors.mockResolvedValue({ contributors: [{ name: "someone" }], lastUpdated: Date.now() })
      await onPreBootstrap({ cache, actions: {} })
    })

    beforeEach(async () => {
      // Clear the cache
      onPluginInit()

      // Needed so that we do not short circuit the git path
      return onCreateNode({
        node,
        createContentDigest,
        createNodeId,
        actions,
      })
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it("creates an scm node", async () => {
      expect(createNode).toHaveBeenCalled()
    })


    it("creates a repository node", async () => {
      expect(createRepository).toHaveBeenCalledWith(expect.anything(),
        expect.objectContaining({
          url: url,
          project: projectName,
          owner: ownerName
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
      expect(createNode).toHaveBeenCalledWith(expect.objectContaining({ repository: url }))
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


    it("fills in an issue count", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({ issues: 16 })
      )
    })

    it("fills in last updated information", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({ lastUpdated: expect.anything() })
      )
    })

    it("fills in contributor information", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({ contributorsWithFullCompanyInfo: expect.arrayContaining([expect.anything()]) })
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

    it("fills in a url for the samples", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          samplesUrl:
            [{
              description: "samples",
              url: "http://fake.github.com/someuser/somerepo/blob/unusual/some-other-path/samples"
            }],
        })
      )
    })

    it("fills in a path for the extension", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          extensionPathInRepo:
            "some-folder-name/",
        })
      )
    })

    it("fills in a url for the extension", () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          extensionRootUrl:
            "http://fake.github.com/someuser/somerepo/blob/unusual/some-folder-name/",
        })
      )
    })

    it("invokes the github graphql api", async () => {
      expect(queryGraphQl).toHaveBeenCalled()
      expect(queryGraphQl).toHaveBeenCalledWith(
        // This is a bit fragile with the assumptions about whitespace and a bit fiddly with the slashes, but it checks we did a query and got the project name right
        expect.stringMatching(/name: ?\"somerepo\"/),
      )
    })

    it("caches the issue count", async () => {
      expect(queryGraphQl).toHaveBeenCalledWith(expect.stringMatching(/issues\(states:OPEN/))

      // Reset call counts and histories, since the code may not even do a query
      jest.clearAllMocks()

      // Now re-trigger the invocation
      await onCreateNode(
        {
          node,
          createContentDigest,
          createNodeId,
          actions,
        },
        {}
      )

      // But it should not ask for the issues
      expect(queryGraphQl).not.toHaveBeenCalledWith(expect.stringMatching(/issues\(states:OPEN/))

      // It should set an issue count, even though it didn't ask for one
      expect(createNode).toHaveBeenLastCalledWith(
        expect.objectContaining({ issues: 16 })
      )
    })

    it("caches the top-level quarkus-extension.yaml", async () => {
      expect(queryGraphQl).toHaveBeenCalledWith(expect.stringMatching(
          /HEAD:runtime\/src\/main\/resources\/META-INF/
        )
      )

      // Reset call counts and histories, since the code may not even do a query
      jest.clearAllMocks()

      // Now re-trigger the invocation
      await onCreateNode(
        {
          node,
          createContentDigest,
          createNodeId,
          actions,
        },
        {}
      )

      // But it should not ask for the top-level meta-inf listing
      expect(queryGraphQl).not.toHaveBeenCalledWith(
        expect.stringMatching(/HEAD:runtime\/src\/main\/resources\/META-INF/),
      )

      // It should set an extension descriptor path, even though it didn't ask for one
      expect(createNode).toHaveBeenLastCalledWith(
        expect.objectContaining({
          extensionYamlUrl:
            url +
            "blob/unusual/some-folder-name/runtime/src/main/resources/META-INF/quarkus-extension.yaml",
          extensionPathInRepo:
            "some-folder-name/",
        })
      )

      // It should fill in the cached information for everything else
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerImageUrl: "http://something.com/someuser.png",
        })
      )
    })

    it("caches the quarkus-extension.yaml in subfolders", async () => {
      // Sense check of what happened in beforeEach
      expect(queryGraphQl).toHaveBeenCalledWith(
        expect.stringMatching(
          /HEAD:something\/runtime\/src\/main\/resources\/META-INF/
        ),
      )

      // Reset call counts and histories, since the code may not even do a query
      jest.clearAllMocks()
      // Now re-trigger the invocation
      await onCreateNode(
        {
          node,
          createContentDigest,
          createNodeId,
          actions,
        },
        {}
      )

      // And it should not ask for the subfolder meta-inf listing
      // It possibly won't ask for anything at all
      expect(queryGraphQl).not.toHaveBeenCalledWith(
        expect.stringMatching(
          /HEAD:something\/runtime\/src\/main\/resources\/META-INF/
        ),
      )

      // It should set an extension descriptor path and extension path
      expect(createNode).toHaveBeenLastCalledWith(
        expect.objectContaining({
          extensionYamlUrl:
            url +
            "blob/unusual/some-folder-name/runtime/src/main/resources/META-INF/quarkus-extension.yaml",
        })
      )
    })

    it("does not cache the issue count on a subsequent call for a different project", async () => {
      // Re-trigger the invocation
      const newIssueCount = 56
      response.data.repository.issues.totalCount = newIssueCount

      await onCreateNode(
        {
          node: otherNode,
          createContentDigest,
          createNodeId,
          actions,
        },
        {}
      )

      expect(queryGraphQl).toHaveBeenCalledWith(
        expect.stringMatching(/issues\(states:OPEN/),
      )

      expect(createNode).toHaveBeenLastCalledWith(
        expect.objectContaining({ issues: newIssueCount })
      )
    })

    it("does not create any remote file nodes", async () => {
      expect(createRemoteFileNode).not.toHaveBeenCalled()
    })

    describe("where the scm-url ends with .git", () => {

      const url = "http://phony.github.com/thing.git"

      const response = {
        data: {
          repository: {
            issues: {
              totalCount: 16,
            },
            defaultBranchRef: { name: "unusual" },
          },
          repositoryOwner: { avatarUrl: avatarUrl },
        },
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
        queryGraphQl.mockResolvedValue(response)
        getContributors.mockResolvedValue({ contributors: [{ name: "someone" }], lastUpdated: Date.now() })
        await onPreBootstrap({ cache, actions: {} })
      })

      beforeEach(async () => {
        // Clear the cache
        onPluginInit()

        // Needed so that we do not short circuit the git path
        return onCreateNode({
          node,
          createContentDigest,
          createNodeId,
          actions,
        })
      })

      afterAll(() => {
        jest.clearAllMocks()
      })

      afterEach(() => {
        jest.clearAllMocks()
      })

      it("fills in an issues url", async () => {
        expect(createNode).toHaveBeenCalledWith(
          expect.objectContaining({ issuesUrl: "http://phony.github.com/thing/issues" })
        )
      })

    })

    describe("where the scm-url is a gitbox url", () => {

      const url = "https://gitbox.apache.org/repos/asf?p=camel-quarkus.git;a=summary"
      const expectedUrl = "https://github.com/apache/camel-quarkus"

      const response = {
        data: {
          repository: {
            issues: {
              totalCount: 16,
            },
            defaultBranchRef: { name: "unusual" },
          },
          repositoryOwner: { avatarUrl: avatarUrl },
        },
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
        queryGraphQl.mockResolvedValue(response)
        getContributors.mockResolvedValue({ contributors: [{ name: "someone" }], lastUpdated: Date.now() })
        await onPreBootstrap({ cache, actions: {} })
      })

      beforeEach(async () => {
        // Clear the cache
        onPluginInit()

        // Needed so that we do not short circuit the git path
        return onCreateNode({
          node,
          createContentDigest,
          createNodeId,
          actions,
        })
      })

      afterAll(() => {
        jest.clearAllMocks()
      })

      afterEach(() => {
        jest.clearAllMocks()
      })

      it("adjusts the scm url", async () => {
        expect(createNode).toHaveBeenCalledWith(
          expect.objectContaining({ repository: expectedUrl })
        )
      })

      it("fills in an issues url", async () => {
        expect(createNode).toHaveBeenCalledWith(
          expect.objectContaining({ issuesUrl: `${expectedUrl}/issues` })
        )
      })

    })
  })


  describe("where a label should be used", () => {
    const url = "https://github.com/quarkusio/quarkus"
    const issuesUrl =
      url +
      "/issues?q=is%3Aopen+is%3Aissue+label%3Aarea%2Falabel,area%2Fanotherlabel"
    const secondIssuesUrl =
      url +
      "/issues?q=is%3Aopen+is%3Aissue+label%3Aarea%2Fdifferent,area%2Funique"
    const avatarUrl = "http://something.com/someuser.png"
    const socialMediaPreviewUrl =
      "https://testopengraph.githubassets.com/3096043220541a8ea73deb5cb6baddf0f01d50244737d22402ba12d665e9aec2/quarkiverse/quarkus-some-extension"

    const labels = ["area/alabel", "area/anotherlabel"]
    const secondLabels = ["area/different", "area/unique"]
    const yaml = `triage:
 rules:
  - id: amazon-lambda
    labels: [ area/alabel, area/anotherlabel ]
    directories:
      - extensions/something
      - integration-tests/amazon-lambda
  - id: second
    labels: [ area/different, area/unique ]
    directories:
      - extensions/second`

    const response = {
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
      queryGraphQl.mockResolvedValue(response)
      getRawFileContents.mockResolvedValue(yaml)
      await onPreBootstrap({ cache, actions: {} })
    })

    beforeEach(async () => {
      // Clear the cache
      onPluginInit()

      // Needed so that we do not short circuit the git path
      return onCreateNode({
        node,
        createContentDigest,
        createNodeId,
        actions,
      })
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it("creates an scm node", async () => {
      expect(createNode).toHaveBeenCalled()
    })

    it("creates a content digest", async () => {
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
      expect(createNode).toHaveBeenCalledWith(expect.objectContaining({ repository: url }))
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
            url +
            "/blob/unusual/some-folder-name/runtime/src/main/resources/META-INF/quarkus-extension.yaml",
        })
      )
    })

    it("invokes the github graphql api", async () => {
      expect(queryGraphQl).toHaveBeenCalled()
      expect(queryGraphQl).toHaveBeenCalledWith(
        expect.stringMatching(/name: ?\"quarkus\"/),
      )
    })

    it("caches the issue count", async () => {
      expect(queryGraphQl).toHaveBeenCalledWith(
        // This is a bit fragile with the assumptions about whitespace and a bit fiddly with the slashes, but it checks we did a query and got the project name right
        expect.stringMatching(/issues\(states:OPEN/),
      )

      // Now re-trigger the invocation
      jest.clearAllMocks()

      await onCreateNode(
        {
          node,
          createContentDigest,
          createNodeId,
          actions,
        },
        {}
      )

      expect(queryGraphQl).not.toHaveBeenCalledWith(
        expect.stringMatching(/issues\(states:OPEN/),
      )

      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({ issues: 16 })
      )
    })

    it("does not cache the labels and issue url", async () => {
      expect(queryGraphQl).toHaveBeenCalledWith(
        // This is a bit fragile with the assumptions about whitespace and a bit fiddly with the slashes, but it checks we did a query and got the project name right
        expect.stringMatching(/issues\(states:OPEN/),
      )

      // Now re-trigger the invocation
      response.data.repository.issues.totalCount = 4

      node.metadata.maven.artifactId = "second"

      await onCreateNode(
        {
          node,
          createContentDigest,
          createNodeId,
          actions,
        },
        {}
      )

      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({ issuesUrl: secondIssuesUrl })
      )

      // It should return the labels for this extension
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({ labels: secondLabels })
      )
    })

    it("caches the top-level quarkus-extension.yaml", async () => {
      // Reset call counts
      jest.clearAllMocks()
      // Now re-trigger the invocation
      await onCreateNode(
        {
          node,
          createContentDigest,
          createNodeId,
          actions,
        },
        {}
      )

      // But it should not ask for the top-level meta-inf listing
      expect(queryGraphQl).not.toHaveBeenCalledWith(
        expect.stringMatching(
          /HEAD:runtime\/src\/main\/resources\/META-INF/
        ),
      )

      // It should set an extension descriptor path, even though it didn't ask for one
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          extensionYamlUrl:
            url +
            "/blob/unusual/some-folder-name/runtime/src/main/resources/META-INF/quarkus-extension.yaml",
        })
      )
    })

    it("caches the quarkus-extension.yaml in subfolders", async () => {
      // Reset call counts
      jest.clearAllMocks()

      // Now re-trigger the invocation
      await onCreateNode(
        {
          node,
          createContentDigest,
          createNodeId,
          actions,
        },
        {}
      )

      // And it should not ask for the subfolder meta-inf listing
      expect(queryGraphQl).not.toHaveBeenCalledWith(
        expect.stringMatching(
          /HEAD:second\/runtime\/src\/main\/resources\/META-INF/
        ),
      )

      // It should set an extension descriptor path
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          extensionYamlUrl:
            url +
            "/blob/unusual/some-folder-name/runtime/src/main/resources/META-INF/quarkus-extension.yaml",
        })
      )
    })

    it("caches the image location", async () => {
      expect(queryGraphQl).toHaveBeenCalledWith(
        expect.stringMatching(/issues\(states:OPEN/),
      )

      response.data.repository.issues.totalCount = 7

      // Reset call counts
      jest.clearAllMocks()

      // Now re-trigger the invocation
      await onCreateNode(
        {
          node,
          createContentDigest,
          createNodeId,
          actions,
        },
        {}
      )

      expect(queryGraphQl).not.toHaveBeenCalled()


      // It should fill in the cached information for images
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerImageUrl: "http://something.com/someuser.png",
        })
      )
    })
  })

  describe("where the social media preview has been set by the user", () => {
    const url = "http://fake.github.com/someuser/aproject"

    const avatarUrl = "http://something.com/someuser.png"
    const socialMediaPreviewUrl =
      "https://repository-images.githubusercontent.com/437045322/39ad4dec-e606-4b21-bb24-4c09a4790b58"

    const response = {
      data: {
        repository: {
          issues: {
            totalCount: 10,
          },
          openGraphImageUrl: socialMediaPreviewUrl,
        },
        repositoryOwner: { avatarUrl: avatarUrl },
      },
    }

    const metadata = {
      sourceControl: `${url},uniquenessstuff`,
    }

    const node = {
      metadata,
      internal,
    }

    beforeAll(async () => {
      queryGraphQl.mockResolvedValue(response)
      await onPreBootstrap({ cache, actions: {} })
      return onCreateNode({
        node,
        createContentDigest,
        createNodeId,
        actions,
      })
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    it("creates a new file node with the cropped image", async () => {
      expect(createRemoteFileNode).toHaveBeenCalledWith(
        expect.objectContaining({ url: socialMediaPreviewUrl })
      )
    })
  })

  describe("reading sponsor information from the extension catalog", () => {
    const sponsor1 = "Big Company Inc"
    const sponsor2 = "Small Company Inc"
    const contributingcompany1 = "Modest Company"
    const contributingcompany2 = "Maybe, Inc"

    const yaml = `
named-sponsors:
  - ${sponsor1}
  - ${sponsor2}
named-contributing-orgs:
  - ${contributingcompany1}
  - ${contributingcompany2}
    `

    beforeAll(async () => {
      getRawFileContents.mockResolvedValue(yaml)

      await sourceNodes({
          createContentDigest,
          createNodeId,
          actions,
        }
      )

    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    it("creates a contributing company node for each entry in the remote file", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          name: sponsor1,
        })
      )
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          name: sponsor2,
        })
      )
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          name: contributingcompany1,
        })
      )
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          name: contributingcompany2,
        })
      )
    })

    it("sets a suitable source for sponsors", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          name: sponsor1,
          source: "extension-catalog-sponsor"
        })
      )

      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          name: contributingcompany1,
          source: "extension-catalog-contributing-company"
        })
      )

    })

    it("creates a contributing company node with a suitable type", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          internal: expect.objectContaining({ type: "ContributingCompany" }),
        })
      )
    })

    it("creates a contributing company node with a meaningful id", async () => {
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          id: sponsor1,
        })
      )
    })

    it("creates a contributing company node with a proper content digest", async () => {
      expect(createContentDigest).toHaveBeenCalled()
      expect(createNode).toHaveBeenCalledWith(
        expect.objectContaining({
          internal: expect.objectContaining({ contentDigest }),
        })
      )
    })
  })

  describe("sanitising the list of contributing companies and sponsors to those who have opted in", () => {
    // These tests are a bit lazy with the mocking, because findAll's function returns an iterable, not an array, but as the tests are mocking-heavy, I don't think going further is that helpful
    const createResolversFn = jest.fn()
    const args = ""

    describe("getting sponsors", () => {

      beforeEach(() => {
        createResolvers({ createResolvers: createResolversFn })
      })

      afterEach(() => {
        jest.clearAllMocks()
      })

      it("returns undefined when there are no sponsors", async () => {
        const optedIn = []
        const param = createResolversFn.mock.calls[0][0]
        // Try and exercise the resolver by drilling down
        const source = {
          allSponsors: ["Rather secretive", "Very Public", "A bit forgetful"]
        }
        const resolve = param.SourceControlInfo.sponsors.resolve

        const context = {
          nodeModel: {
            findAll: jest.fn().mockResolvedValue({ entries: optedIn })
          }
        }

        const answer = await resolve(source, args, context)
        expect(answer).toBeUndefined()
      })

      it("filters out companies that are not in the opt-in list", async () => {
        const optedIn = [{ name: "Very Public" }]
        expect(createResolversFn).toHaveBeenCalled()
        const param = createResolversFn.mock.calls[0][0]
        // Try and exercise the resolver by drilling down
        const source = {
          allSponsors: ["Rather secretive", "Very Public", "A bit forgetful"]
        }
        const resolve = param.SourceControlInfo.sponsors.resolve

        const context = {
          nodeModel: {
            findAll: jest.fn().mockResolvedValue({ entries: optedIn })
          }
        }

        const answer = await resolve(source, args, context)
        expect(answer).toStrictEqual(["Very Public"])
      })


      it("returns more than one sponsor if more than one applies", async () => {
        const optedIn = [{ name: "Very Public" }, { name: "Mostly out there" }]
        expect(createResolversFn).toHaveBeenCalled()
        const param = createResolversFn.mock.calls[0][0]
        // Try and exercise the resolver by drilling down
        const source = {
          allSponsors: ["Rather secretive", "Very Public", "A bit forgetful", "Mostly out there"]
        }
        const resolve = param.SourceControlInfo.sponsors.resolve
        const context = {
          nodeModel: {
            findAll: jest.fn().mockResolvedValue({ entries: optedIn })
          }
        }

        const answer = await resolve(source, args, context)
        expect(answer).toStrictEqual(["Very Public", "Mostly out there"])
      })

      it("excludes companies who have only opted in as non-sponsors", async () => {
        const optedIn = [{ name: "Very Public" }, {
          name: "Mostly out there",
          source: "extension-catalog-contributing-company"
        }]
        const param = createResolversFn.mock.calls[0][0]
        // Try and exercise the resolver by drilling down
        const source = {
          allSponsors: ["Rather secretive", "Very Public", "A bit forgetful", "Mostly out there"]
        }
        const resolve = param.SourceControlInfo.sponsors.resolve

        const context = {
          nodeModel: {
            findAll: jest.fn().mockResolvedValue({ entries: optedIn })
          }
        }

        const answer = await resolve(source, args, context)
        expect(answer).toStrictEqual(["Very Public"])
      })
    })

    describe("getting contributing companies", () => {

      const createResolversFn = jest.fn()
      const source = {
        allCompanies: [{
          "name": "Nice Hat",
          contributions: 4,
          contributors: 3
        },
          {
            "name": "Another Hat",
            contributions: 4,
            contributors: 1
          }
          ,
          {
            "name": "Timid Hat",
            contributions: 3,
            contributors: 1
          }
        ]
      }


      beforeEach(() => {
        createResolvers({ createResolvers: createResolversFn })
      })

      afterEach(() => {
        jest.clearAllMocks()
      })


      it("includes companies which have opted in", async () => {
        const optedIn = [{ name: "Nice Hat" }]
        const param = createResolversFn.mock.calls[0][0]
        // Try and exercise the resolver by drilling down

        const resolve = param.SourceControlInfo.companies.resolve

        const context = {
          nodeModel: {
            findAll: jest.fn().mockResolvedValue({ entries: optedIn })
          }
        }

        const contributors = await resolve(source, args, context)

        expect(contributors).toContainEqual(
          {
            "name": "Nice Hat",
            contributions: 4,
            contributors: 3
          })
      })

      it("excludes companies which have not opted in", async () => {
        const optedIn = [{ name: "Another Hat" }]
        const param = createResolversFn.mock.calls[0][0]
        // Try and exercise the resolver by drilling down

        const resolve = param.SourceControlInfo.companies.resolve

        const context = {
          nodeModel: {
            findAll: jest.fn().mockResolvedValue({ entries: optedIn })
          }
        }

        const contributors = await resolve(source, args, context)

        expect(contributors).not.toContainEqual(
          expect.objectContaining({
            "name": "Nice Hat"
          }))
      })

      it("aggregates contributions from excluded companies", async () => {
        const optedIn = [{ name: "Nice Hat" }]
        const param = createResolversFn.mock.calls[0][0]

        const resolve = param.SourceControlInfo.companies.resolve

        const context = {
          nodeModel: {
            findAll: jest.fn().mockResolvedValue({ entries: optedIn })
          }
        }

        const contributors = await resolve(source, args, context)

        expect(contributors).toHaveLength(2)
        expect(contributors).toContainEqual({
          "name": "Other",
          contributions: 7,
          contributors: 2
        })
      })
    })

    // TODO test for re-sorting with other? Or do we care?

  })
})

