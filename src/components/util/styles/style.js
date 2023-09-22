// Ideally, we would import these variables from the styles.css, to be DRY
// However, I've tried getComputedValue and css-variables-parser, and I cannot find a solution
// that works in both `gatsby build` and in `gatsby develop`.
// So WET it is.

import Values from "values.js"

const styles = { "grey-2": "#555555", "border-radius": "10px" }

const quarkusBlue = new Values("#4695EB")
const white = new Values("#ffffff")

const getPalette = (n) => {

  // Simple case, just do a blue spectrum
  if (n <= 10) {
    const increment = 100 / n
    return [...Array(n).keys()].map(i => quarkusBlue.tint(i * increment).hexString())
  } else {
    // Do a cyclical range of colours, from blue down to white, then through shades of grey, then black from black to blue
    const blueElements = Math.min(Math.round(n / 3) + 1, 6)
    const greyElements = n - 2 * blueElements
    const blueIncrement = 100 / (2 * blueElements)
    const greyIncrement = 100 / greyElements

    const tints = [...Array(blueElements).keys()].map(i => quarkusBlue.tint(i * blueIncrement).hexString())
    const shades = [...Array(blueElements).keys()].map(i => quarkusBlue.shade((2 * blueElements - i) * blueIncrement).hexString())
    const greys = [...Array(greyElements).keys()].map(i => white.shade(i * greyIncrement).hexString())

    return [...tints, ...greys, ...shades]
  }
}

export { styles, getPalette }
