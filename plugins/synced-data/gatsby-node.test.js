/**
 * @jest-environment node
 */

const fs = require("fs")
const { sourceNodes, createResolvers } = require("./gatsby-node")
const { createRemoteFileNode } = require("gatsby-source-filesystem")
const { getRepoOverviewNoCache } = require("../../tools/sync/scm-info")

jest.mock("gatsby-source-filesystem")
jest.mock("../../tools/sync/scm-info", () => ({ getRepoOverviewNoCache: jest.fn() }))

const contentDigest = "some content digest"
const createNode = jest.fn()
const createNodeId = jest.fn().mockImplementation(id => id)
const createContentDigest = jest.fn().mockReturnValue(contentDigest)
const actions = { createNode }

const mockDataFiles = files => {
  jest.spyOn(fs, "readFileSync").mockImplementation(file => {
    const name = Object.keys(files).find(n => file.endsWith(n))
    if (name) return JSON.stringify(files[name])
    throw new Error("ENOENT")
  })
}

describe("the synced data reader", () => {
  beforeAll(() => {
    createRemoteFileNode.mockReturnValue({ absolutePath: "/hi/there/path.ext" })
    jest.spyOn(console, "warn").mockImplementation(() => {
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
    fs.readFileSync.mockRestore?.()
  })

  describe("source control information", () => {
    const key = "http://fake.github.com/someuser/somerepo,grouper.something"
    const url = "http://fake.github.com/someuser/somerepo"
    const socialImage = "https://repository-images.githubusercontent.com/437045322/39ad4dec"

    beforeEach(async () => {
      mockDataFiles({
        "source-control-info.json": {
          [key]: { repository: url, project: "somerepo", owner: "someuser", issues: "16", socialImage }
        }
      })
      await sourceNodes({ actions, createNodeId, createContentDigest })
    })

    it("creates a node with the right type, id and key", () => {
      expect(createNode).toHaveBeenCalledWith(expect.objectContaining({
        id: key, key, issues: "16", repository: url,
        internal: { type: "SourceControlInfo", contentDigest }
      }))
    })

    it("creates a repository node", () => {
      expect(createNode).toHaveBeenCalledWith(expect.objectContaining({
        id: url, url, project: "somerepo", owner: "someuser",
        internal: expect.objectContaining({ type: "Repository" })
      }))
    })

    it("downloads the social image and links to the cropped version", () => {
      expect(createRemoteFileNode).toHaveBeenCalledWith(expect.objectContaining({ url: socialImage }))
      expect(createNode).toHaveBeenCalledWith(expect.objectContaining({ projectImage: "smartcrop-path.ext" }))
    })
  })

  describe("when the social image url is signed and expires", () => {
    const key = "http://fake.github.com/someuser/aproject,uniquenessstuff"
    const expiredUrl = "https://repository-images.githubusercontent.com/abc/9c2af8ee-c6e0?X-Amz-Expires=300&jwt=OLD"
    const freshUrl = "https://repository-images.githubusercontent.com/abc/9c2af8ee-c6e0?X-Amz-Expires=300&jwt=FRESH"
    const expiry = { message: "Response code 618 (jwt:expired)", statusCode: 618 }

    beforeEach(() => {
      mockDataFiles({
        "source-control-info.json": {
          [key]: { repository: "http://fake.github.com/someuser/aproject", project: "aproject", owner: "someuser", socialImage: expiredUrl }
        }
      })
      jest.spyOn(console, "error").mockImplementation(() => {
      })
    })

    afterEach(() => {
      createRemoteFileNode.mockReset()
      createRemoteFileNode.mockReturnValue({ absolutePath: "/hi/there/path.ext" })
      getRepoOverviewNoCache.mockReset()
    })

    it("uses a short filename, without the query parameters", async () => {
      await sourceNodes({ actions, createNodeId, createContentDigest })
      expect(createRemoteFileNode).toHaveBeenCalledWith(expect.objectContaining({
        name: "9c2af8ee-c6e0", url: expiredUrl
      }))
    })

    it("retries with a fresh url from GitHub", async () => {
      createRemoteFileNode.mockRejectedValueOnce(expiry).mockResolvedValueOnce({ absolutePath: "/cached/image.png" })
      getRepoOverviewNoCache.mockResolvedValue({ socialImage: freshUrl })

      await sourceNodes({ actions, createNodeId, createContentDigest })

      expect(getRepoOverviewNoCache).toHaveBeenCalledWith({ owner: "someuser", name: "aproject" })
      expect(createRemoteFileNode).toHaveBeenCalledWith(expect.objectContaining({ url: freshUrl }))
      expect(createNode).toHaveBeenCalledWith(expect.objectContaining({ projectImage: "smartcrop-image.png" }))
    })

    it("skips the image if GitHub cannot give a fresh url", async () => {
      createRemoteFileNode.mockRejectedValueOnce(expiry)
      getRepoOverviewNoCache.mockResolvedValue(undefined)

      await sourceNodes({ actions, createNodeId, createContentDigest })

      expect(createNode).toHaveBeenCalledWith(expect.objectContaining({ key }))
      expect(createNode).not.toHaveBeenCalledWith(expect.objectContaining({ projectImage: expect.anything() }))
    })
  })

  describe("contributing companies", () => {
    beforeEach(async () => {
      mockDataFiles({
        "contributing-companies.json": {
          namedSponsors: ["Big Company Inc"],
          namedContributingOrgs: ["Modest Company"],
          metadataSponsors: ["Explicit Company"]
        }
      })
      await sourceNodes({ actions, createNodeId, createContentDigest })
    })

    it.each([
      ["Big Company Inc", "extension-catalog-sponsor"],
      ["Modest Company", "extension-catalog-contributing-company"],
      ["Explicit Company", "metadata-sponsor"],
    ])("creates a node for %s with source %s", (name, source) => {
      expect(createNode).toHaveBeenCalledWith(expect.objectContaining({
        id: name, name, source,
        internal: { type: "ContributingCompany", contentDigest }
      }))
    })
  })

  describe("download rankings", () => {
    const date = "2025-01-01T00:00:00.000Z"

    beforeEach(async () => {
      mockDataFiles({
        "download-ranking.json": {
          date,
          ranking: [{ artifactId: "quarkus-popular", rank: 1 }, { artifactId: "tools", rank: 3 }]
        }
      })
      await sourceNodes({ actions, createNodeId, createContentDigest })
    })

    it("creates a node for the date", () => {
      expect(createNode).toHaveBeenCalledWith(expect.objectContaining({
        date, internal: expect.objectContaining({ type: "DownloadDataDate" })
      }))
    })

    it("creates a node for each artifact", () => {
      expect(createNode).toHaveBeenCalledWith(expect.objectContaining({
        artifactId: "tools", rank: 3, internal: expect.objectContaining({ type: "DownloadRanking" })
      }))
      expect(createNode).toHaveBeenCalledWith(expect.objectContaining({ artifactId: "quarkus-popular", rank: 1 }))
    })
  })

  describe("when the data files are missing or empty", () => {
    it("creates no nodes and does not throw", async () => {
      mockDataFiles({})
      await sourceNodes({ actions, createNodeId, createContentDigest })
      expect(createNode).not.toHaveBeenCalled()
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
