import { createRepository, getResolvers } from "./repository-creator"

describe("the repository creator", () => {

  const createNode = jest.fn()
  const createNodeId = jest.fn()
  const createContentDigest = jest.fn()
  const actions = { createNode }

  const url = "http://somerepo.org/ownerama/projector"

  afterAll(() => {
    jest.resetAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  beforeEach(() => {
    createRepository({ actions, createNodeId, createContentDigest }, { url, owner: "ownerama", project: "projector" })
  })


  it("creates a node", () => {
    expect(createNode).toHaveBeenCalled()
  })

  it("uses the url as the id", () => {
    expect(createNode).toHaveBeenCalledWith(expect.objectContaining({ id: url }))
  })

  it("fills in a project name", async () => {
    expect(createNode).toHaveBeenCalledWith(
      expect.objectContaining({ project: "projector" })
    )
  })

  it("fills in the owner name", async () => {
    expect(createNode).toHaveBeenCalledWith(
      expect.objectContaining({ owner: "ownerama" })
    )
  })

  describe("counting extensions", () => { // These tests are a bit lazy with the mocking, because findAll's function returns an iterable, not an array, but as the tests are mocking-heavy, I don't think going further is that helpful
    const args = ""
    const a = {}
    const b = {}
    const c = {}

    let thing

    beforeEach(() => {
      thing = getResolvers({})
    })

    it("returns the extensions that find gives", async () => {
      const extensions = [a, b, c]
      // Try and exercise the resolver by drilling down
      const source = {
        allSponsors: ["Rather secretive", "Very Public", "A bit forgetful"]
      }

      // This is a kind of weak test because we don't validate the query; that has to be done by trying it on a real system, really
      const context = {
        nodeModel: {
          findAll: jest.fn().mockResolvedValue({ entries: extensions })
        }
      }

      const resolve = thing.Repository.extensions.resolve

      const answer = await resolve(source, args, context)
      expect(answer).toStrictEqual([a, b, c])
    })

    it("returns an extension count", async () => {
      const extensions = [a, b, c]
      // Try and exercise the resolver by drilling down
      const source = {
        url: "someurl"
      }

      const context = {
        nodeModel: {
          findAll: jest.fn().mockResolvedValue({ entries: extensions })
        }
      }

      const resolve = thing.Repository.extensionCount.resolve

      const answer = await resolve(source, args, context)
      expect(answer).toBe(extensions.length)
    })

  })
})