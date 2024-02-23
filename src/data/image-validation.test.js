const { validate } = require("./image-validation")


const axios = require("axios")
jest.mock("axios")

const sharp = require("sharp")
const statsFn = jest.fn()

jest.mock("sharp")
sharp.mockReturnValue({
  stats: statsFn
})


describe("validating", () => {

  const image = ["f", "a", "k", "e"]

  let answer
  describe("when the image is valid", () => {
    beforeAll(async () => {
      axios.get.mockResolvedValue({ data: image })
      statsFn.mockResolvedValue({ height: 6, width: 10 })
      answer = await validate(image)
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    it("calls sharp with the right image", async () => {
      expect(sharp).toHaveBeenCalledWith(Buffer.from(image))
    })

    it("calls stats to establish validity", async () => {
      expect(statsFn).toHaveBeenCalled()
    })

    it("returns true", async () => {
      expect(answer).toBe(true)
    })
  })

  describe("when the image is corrupted", () => {
    beforeAll(async () => {
      statsFn.mockRejectedValue(new Error())
      answer = await validate(image)
    })

    afterAll(() => {
      jest.clearAllMocks()
    })

    it("calls sharp with the right image", async () => {
      expect(sharp).toHaveBeenCalledWith(Buffer.from(image))
    })

    it("calls stats to establish validity", async () => {
      expect(statsFn).toHaveBeenCalled()
    })

    it("returns false", async () => {
      expect(answer).toBe(false)
    })
  })
})
