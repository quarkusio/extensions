import { compareStatus } from "./compare-status"

describe("status comparison", () => {
  it("can be used to sort statuses into the right order", () => {
    const unsorted = ["experimental", "stable", "deprecated", "preview"]
    unsorted.sort(compareStatus)
    expect(unsorted).toEqual([
      "stable",
      "preview",
      "experimental",
      "deprecated",
    ])
  })

  it("gracefully handles unknown values and slots them near the end", () => {
    const unsorted = [
      "experimental",
      "wizard",
      "stable",
      "deprecated",
      "preview",
    ]
    unsorted.sort(compareStatus)
    expect(unsorted).toEqual([
      "stable",
      "preview",
      "experimental",
      "wizard",
      "deprecated",
    ])
  })
})
