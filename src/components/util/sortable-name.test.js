import { sortableName } from "./sortable-name"

describe("name sort helper", () => {
  it("handles arbitrary strings", () => {
    expect(sortableName("Stuff")).toBe("stuff")
  })

  it("handles nulls", () => {
    expect(sortableName()).toBe()
  })

  it("strips hyphens", () => {
    expect(sortableName("Quarkus - CXF")).toBe("cxf")
  })
})
