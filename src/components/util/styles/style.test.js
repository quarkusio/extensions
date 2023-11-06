import { getPalette } from "./style"

describe("the styles helper", () => {
  describe("the palette generator", () => {
    const QUARKUS_BLUE = "#4695eb"
    const quarkusTints = ["#4695eb", "#59a0ed", "#6baaef", "#7eb5f1", "#90bff3", "#a3caf5", "#b5d5f7", "#c8dff9", "#daeafb", "#edf4fd",]


    it("returns quarkus blue if the length is 1", () => {
      const palette = getPalette(1, QUARKUS_BLUE)
      expect(palette).toHaveLength(1)
      expect(palette[0]).toBe(QUARKUS_BLUE)
    })

    it("returns palettes of the correct length", () => {
      expect(getPalette(6)).toHaveLength(6)
      expect(getPalette(14)).toHaveLength(14)
      expect(getPalette(15)).toHaveLength(15)
      expect(getPalette(16)).toHaveLength(16)
      expect(getPalette(17)).toHaveLength(17)
    })

    it("returns variations of Quarkus blue for limited numbers of entries", () => {
      const palette = getPalette(10, QUARKUS_BLUE)

      // We start with Quarkus blue and then go down
      expect(palette[0]).toBe(QUARKUS_BLUE)
      expect(palette).toStrictEqual(quarkusTints)
    })

    it("fills in very long palettes with shades of grey", () => {
      const palette = getPalette(100)
      expect(palette[50]).toBe("#7f7f7f")
      expect(palette).toContain("#ffffff")
      expect(palette).toContain("#000000")
    })
  })
})