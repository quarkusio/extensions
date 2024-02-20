import { timestampExtensionComparator } from "./timestamp-extension-comparator"

describe("the timestamp extension comparator", () => {
  it("sorts alphabetically when there is no date", () => {
    const a = { sortableName: "alpha" }
    const b = { sortableName: "beta" }

    expect(timestampExtensionComparator(a, b)).toBe(-1)
    expect(timestampExtensionComparator(b, a)).toBe(1)
  })

  it("put extensions with a name ahead of those without", () => {
    const a = { sortableName: "alpha" }
    const b = {}

    expect(timestampExtensionComparator(a, b)).toBe(-1)
    expect(timestampExtensionComparator(b, a)).toBe(1)
  })

  it("sorts by date", () => {
    const a = { metadata: { maven: { timestamp: 1695044005 } } }
    const b = { metadata: { maven: { timestamp: 1095044005 } } }

    expect(timestampExtensionComparator(a, b)).toBeLessThan(0)
    expect(timestampExtensionComparator(b, a)).toBeGreaterThan(0)
  })

  it("puts extensions with a date ahead of those without", () => {
    const a = { metadata: { maven: { timestamp: 1695044005 } } }
    const b = {}

    expect(timestampExtensionComparator(a, b)).toBe(-1)
    expect(timestampExtensionComparator(b, a)).toBe(1)
  })

  it("returns 0 when the dates are equal and there is no name", () => {
    const a = { metadata: { maven: { timestamp: 1695044005 } } }

    expect(timestampExtensionComparator(a, a)).toBe(0)
  })

  it("sorts alphabetically when the dates are equal", () => {
    const a = { sortableName: "alpha", metadata: { maven: { timestamp: 1695044005 } } }
    const b = { sortableName: "beta", metadata: { maven: { timestamp: 1695044005 } } }

    expect(timestampExtensionComparator(a, b)).toBe(-1)
    expect(timestampExtensionComparator(b, a)).toBe(1)
  })

  // If extensions are released at roughly the same time, their timestamp will be different, but we should group them alphabetically
  it("sorts alphabetically when the dates are within an hour of each other", () => {
    const a = { sortableName: "alpha", metadata: { maven: { timestamp: 1695044005 } } }
    const b = { sortableName: "beta", metadata: { maven: { timestamp: 1695040465 } } }

    expect(timestampExtensionComparator(a, b)).toBe(-1)
    expect(timestampExtensionComparator(b, a)).toBe(1)
  })

})