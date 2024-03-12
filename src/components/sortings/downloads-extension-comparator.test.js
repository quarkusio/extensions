import { downloadsExtensionComparator } from "./downloads-extension-comparator"

describe("the popularity extension comparator", () => {


  it("sorts by rank", () => {
    const a = { metadata: { maven: { timestamp: 1695044005 }, downloads: { rank: 2 } } }
    const b = { metadata: { maven: { timestamp: 1695044015 }, downloads: { rank: 1 } } }
    const c = { metadata: { maven: { timestamp: 1695044010 }, downloads: { rank: 3 } } }

    expect(downloadsExtensionComparator(b, a)).toBeLessThan(0)
    expect(downloadsExtensionComparator(a, b)).toBeGreaterThan(0)
    expect(downloadsExtensionComparator(a, c)).toBeLessThan(0)
    expect(downloadsExtensionComparator(c, a)).toBeGreaterThan(0)
  })

  it("puts extensions with a rank ahead of those without", () => {
    const a = { metadata: { maven: { timestamp: 1695044005 }, downloads: { rank: 2 } } }
    const b = { metadata: { maven: { timestamp: 1695044005 } } }

    expect(downloadsExtensionComparator(a, b)).toBe(-1)
    expect(downloadsExtensionComparator(b, a)).toBe(1)
  })

  it("sorts by date when there is no rank and puts extensions with a date ahead of those without", () => {
    const a = { metadata: { maven: { timestamp: 1695044005 } } }
    const b = {}

    expect(downloadsExtensionComparator(a, b)).toBe(-1)
    expect(downloadsExtensionComparator(b, a)).toBe(1)
  })

  it("sorts by date when there is no rank and returns 0 when the dates are equal", () => {
    const a = { metadata: { maven: { timestamp: 1695044005 } } }

    expect(downloadsExtensionComparator(a, a)).toBe(0)
  })

  it("sorts by date when there is no rank and sorts alphabetically when the dates are equal", () => {
    const a = { sortableName: "alpha", metadata: { maven: { timestamp: 1695044005 } } }
    const b = { sortableName: "beta", metadata: { maven: { timestamp: 1696044005 } } }

    expect(downloadsExtensionComparator(a, b)).toBe(-1)
    expect(downloadsExtensionComparator(b, a)).toBe(1)
  })

  // If extensions are released at roughly the same time, their timestamp will be different, but we should group them alphabetically
  it("sorts by date when there is no rank and sorts alphabetically when the dates are within an hour of each other", () => {
    const a = { sortableName: "alpha", metadata: { maven: { timestamp: 1695044005 } } }
    const b = { sortableName: "beta", metadata: { maven: { timestamp: 1695040465 } } }

    expect(downloadsExtensionComparator(a, b)).toBe(-1)
    expect(downloadsExtensionComparator(b, a)).toBe(1)
  })

  it("produces the correct list order when used in a sort", () => {
    const a = { metadata: { maven: { timestamp: 1695044005 }, downloads: { rank: 2 } } }
    const b = { metadata: { maven: { timestamp: 1695044015 }, downloads: { rank: 1 } } }
    const c = { metadata: { maven: { timestamp: 1695044010 }, downloads: { rank: 3 } } }
    const unrankeda = { metadata: { maven: { timestamp: 1695044005 } } }
    const unrankedb = { metadata: { maven: { timestamp: 1705044005 } } }

    const list = [a, unrankeda, b, unrankedb, c]

    expect(list.sort(downloadsExtensionComparator)).toStrictEqual([b, a, c, unrankedb, unrankeda])
  })

})