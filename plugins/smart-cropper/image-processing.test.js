const { crop } = require("./image-processing")

const sharp = require("sharp")
const smartcrop = require("smartcrop-sharp")

jest.mock("sharp")
jest.mock("smartcrop-sharp")

const height = 350
const cropCoords = { x: 300, y: 200, height: height, width: height }

const croppedBuffer = Buffer.from(["z"]) // arbitrary value, for uniqueness

// A bit more mocking than we'd ideally like, but we will live
const mockSharp = {}
mockSharp.metadata = jest
  .fn()
  .mockReturnValue({ height: height, width: height, format: "jpeg" })
mockSharp.resize = jest.fn().mockReturnValue(mockSharp)
mockSharp.extract = jest.fn().mockReturnValue(mockSharp)
mockSharp.toBuffer = jest.fn().mockReturnValue(croppedBuffer)
sharp.mockReturnValue(mockSharp)

smartcrop.crop.mockResolvedValue({ topCrop: cropCoords })

describe("cropping", () => {
  const image = "fake-path"
  let answer

  beforeAll(async () => {
    answer = await crop(image)
  })

  it("calls smartcrop to get the coordinates", async () => {
    expect(smartcrop.crop).toHaveBeenCalledWith(image, expect.anything())
  })

  it("uses the right dimensions from the image for the crop", async () => {
    expect(smartcrop.crop).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        height,
        width: height,
      })
    )
  })

  it("calls sharp with the right image", async () => {
    expect(sharp).toHaveBeenCalledWith(image)
  })

  it("calls sharp with the right coordinates", async () => {
    // we're writing down the implementation a bit here, but it's sensible to check something
    const sharpifiedCoords = {
      width: cropCoords.width,
      height: cropCoords.height,
      left: cropCoords.x,
      top: cropCoords.y,
    }

    expect(mockSharp.extract).toHaveBeenCalledWith(
      expect.objectContaining(sharpifiedCoords)
    )
  })

  it("returns a sensible buffer", async () => {
    expect(answer).toBe(croppedBuffer)
  })
})
