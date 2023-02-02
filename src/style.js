// Ideally, we would import these variables from the styles.css, to be DRY
// However, I've tried getComputedValue and css-variables-parser, and I cannot find a solution
// that works in both `gatsby build` and in `gatsby develop`.
// So WET it is.

const styles = { "grey-2": "#555555", "border-radius": "10px" }

export default styles
