module.exports = {
  "plugins": [
    ["@babel/plugin-transform-private-methods", { "loose": true }],
    ["@babel/plugin-transform-private-property-in-object", { "loose": true }]
  ],
  "presets": [
    [
      "@babel/preset-env",
      {
        "modules": "commonjs"
      }
    ],
    "@babel/preset-react"
  ]
}
