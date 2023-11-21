/**
 * Gatsby's Default ESLint Configuration
 */

const { store } = require("gatsby/dist/redux")
const { eslintConfig } = require("gatsby/dist/utils/eslint-config")
//const { reactHasJsxRuntime } = require("gatsby/dist/utils/webpack-utils")
const reactHasJsxRuntime = () => false

//Load GraphQL Schema
const { schema } = store.getState()

module.exports = {
  // Gatsby Default ESLint Configuration
  ...eslintConfig(schema, reactHasJsxRuntime()).baseConfig,

  // Removes `gatsby/src/utils/eslint-rules`
  extends: "react-app"
  
}
