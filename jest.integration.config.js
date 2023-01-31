module.exports = {
  preset: "jest-puppeteer",
  testEnvironment: "./test-integration/debugenv.js",
  testPathIgnorePatterns: [".cache"],
  setupFilesAfterEnv: ["expect-puppeteer"],
}
