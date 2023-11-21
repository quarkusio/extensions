module.exports = {
  // Extend Gatsby's Default ESLint Configuration
  extends: [`${__dirname}/gatsby-eslint.js`,
    // a good idea, but too many warnings for now "plugin:testing-library/react",
    "plugin:jest/recommended"
  ],

  ignorePatterns: ["public/**"],

  plugins: ["testing-library"],

  // Rules
  rules: {
    "graphql/template-strings": "off", // Disabled because it causes an error; Syntax Error: Unexpected <EOF>
    "react/jsx-uses-react": "error",
    "react/jsx-uses-vars": "error",
    "jest/no-test-prefixes": "warn"
  },

  env: {
    jest: true,
  },
// Puppeteer globals
  globals: {
    page: true,
    browser: true,
  },

}