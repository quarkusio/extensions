/**
 * @jest-environment node
 */

const { onCreateNode } = require("./gatsby-node")

const imageProcessing = require("./image-processing")
const { createFileNodeFromBuffer } = require("gatsby-source-filesystem")

jest.mock("gatsby-source-filesystem")
jest.mock("./image-processing")

const croppedBuffer = Buffer.from([])

imageProcessing.crop.mockResolvedValue(croppedBuffer)

const contentDigest = "some content digest"
const createNode = jest.fn()
const createContentDigest = jest.fn().mockReturnValue(contentDigest)
const actions = { createNode }

describe("the smart cropper", () => {
  describe("for an arbitrary node", () => {
    const node = {
      internal: {
        type: "Extension",
        mediaType: "application/json",
      },
    }

    beforeAll(async () => {
      await onCreateNode({ node, createContentDigest, actions })
    })

    it("does not crop anything", async () => {
      expect(imageProcessing.crop).not.toHaveBeenCalled()
    })

    it("does not create any nodes", async () => {
      expect(createFileNodeFromBuffer).not.toHaveBeenCalled()
    })
  })

  describe("for an arbitrary file", () => {
    const socialMediaPreviewUrl =
      "https://repository-images.githubusercontent.com/437045322/39ad4dec-e606-4b21-bb24-4c09a4790b58"

    const node = {
      url: socialMediaPreviewUrl,
      internal: {
        type: "File",
        mediaType: "application/json",
      },
    }

    beforeAll(async () => {
      await onCreateNode({ node, createContentDigest, actions })
    })

    it("does not crop anything", async () => {
      expect(imageProcessing.crop).not.toHaveBeenCalled()
    })

    it("does not create any nodes", async () => {
      expect(createFileNodeFromBuffer).not.toHaveBeenCalled()
    })
  })

  describe("for an arbitrary image", () => {
    const node = {
      internal: {
        type: "File",
        mediaType: "image/jpeg",
      },
    }

    beforeAll(async () => {
      await onCreateNode({ node, createContentDigest, actions })
    })

    it("does not crop anything", async () => {
      expect(imageProcessing.crop).not.toHaveBeenCalled()
    })

    it("does not create any nodes", async () => {
      expect(createFileNodeFromBuffer).not.toHaveBeenCalled()
    })
  })

  describe("for what appears to be a github user-set image", () => {
    const socialMediaPreviewUrl =
      "https://repository-images.githubusercontent.com/437045322/39ad4dec-e606-4b21-bb24-4c09a4790b58"
    const absolutePath = "local-file"
    const generatedName = "smartcrop-local-file"

    const node = {
      url: socialMediaPreviewUrl,
      absolutePath,
      internal: {
        type: "File",
        mediaType: "image/jpg",
      },
    }

    beforeAll(async () => {
      await onCreateNode({ node, createContentDigest, actions })
    })

    it("crops the image", async () => {
      expect(imageProcessing.crop).toHaveBeenCalled()
    })

    it("creates a new node", async () => {
      expect(createFileNodeFromBuffer).toHaveBeenCalledWith(
        expect.objectContaining({ buffer: croppedBuffer })
      )
    })

    it("sets a sensible name for the node", async () => {
      expect(createFileNodeFromBuffer).toHaveBeenCalledWith(
        expect.objectContaining({ name: generatedName })
      )
    })
  })
})
