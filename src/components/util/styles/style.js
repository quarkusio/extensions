import Values from "values.js"

const white = new Values("#ffffff")

const getPalette = (n, baseCode) => {
  const baseColour = new Values(baseCode)

  // Simple case, just do a coloured spectrum
  if (n <= 10) {
    const increment = 100 / n
    return [...Array(n).keys()].map(i => baseColour.tint(i * increment).hexString())
  } else {
    // Do a cyclical range of colours, from coloured down to white, then through shades of grey, then black from black to coloured
    // In pie charts, thin widges tend to look white because of the border, no matter what colour we set
    const colouredElements = Math.max(Math.round(n / 3) + 1, 6)
    const greyElements = Math.max(0, n - 2 * colouredElements)
    const colouredIncrement = 100 / (2 * colouredElements)
    const greyIncrement = 100 / greyElements

    const tints = [...Array(colouredElements).keys()].map(i => baseColour.tint(i * colouredIncrement).hexString())
    const shades = [...Array(colouredElements).keys()].map(i => baseColour.shade((2 * colouredElements - i) * colouredIncrement).hexString())
    const greys = [...Array(greyElements).keys()].map(i => white.shade(i * greyIncrement).hexString())

    return [...tints, ...greys, ...shades]
  }
}

export { getPalette }
