const { validate } = require("./image-validation")


const axios = require("axios")
jest.mock("axios")

const { validateBufferMIMEType } = require("validate-image-type")
jest.mock("validate-image-type")

describe("validating", () => {

  const image = ["f", "a", "k", "e"]

  let answer
  describe("when the image is valid", () => {
    beforeAll(async () => {
      axios.get.mockResolvedValue({ data: image })
      validateBufferMIMEType.mockResolvedValue({ ok: true })
      answer = await validate(image)
    })

    afterAll(() => {
      jest.clearAllMocks()
    })


    it("calls stats to establish validity", async () => {
      expect(validateBufferMIMEType).toHaveBeenCalled()
    })

    it("returns true", async () => {
      expect(answer).toBe(true)
    })
  })

  describe("when the image is corrupted", () => {
    beforeAll(async () => {
      validateBufferMIMEType.mockRejectedValue(new Error())
      answer = await validate(image)
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    it("calls stats to establish validity", async () => {
      expect(validateBufferMIMEType).toHaveBeenCalled()
    })

    it("returns false", async () => {
      expect(answer).toBe(false)
    })
  })
})
