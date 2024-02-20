import { alphabeticalExtensionComparator } from "./alphabetical-extension-comparator"

describe("the alphabetical extension comparator", () => {
  it("sorts by date when the names are identical", () => {
    const a = { sortableName: "alpha", metadata: { maven: { timestamp: 1795044005 } } }
    const b = { sortableName: "alpha", metadata: { maven: { timestamp: 1695044005 } } }

    expect(alphabeticalExtensionComparator(a, b)).toBeLessThan(0)
    expect(alphabeticalExtensionComparator(b, a)).toBeGreaterThan(0)
  })

  it("put extensions with a name ahead of those without", () => {
    const a = { sortableName: "alpha" }
    const b = {}

    expect(alphabeticalExtensionComparator(a, b)).toBe(-1)
    expect(alphabeticalExtensionComparator(b, a)).toBe(1)
  })

  it("sorts alphabetically", () => {
    const a = { sortableName: "alpha", metadata: { maven: { timestamp: 1795044005 } } }
    const b = { sortableName: "beta", metadata: { maven: { timestamp: 1695044005 } } }

    expect(alphabeticalExtensionComparator(a, b)).toBeLessThan(0)
    expect(alphabeticalExtensionComparator(b, a)).toBeGreaterThan(0)
  })

})