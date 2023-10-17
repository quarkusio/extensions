/**
 * This is useful for validating against real data, but needs a GITHUB_TOKEN to be set.
 * It also needs import fetch from "node-fetch"
 * To get current data to check against, visit https://github.com/quarkiverse/quarkus-ironjacamar/graphs/contributors
 * and adjust the slider to 180 days ago.
 *
 */
jest.setTimeout(15 * 1000)

import { getContributors } from "./sponsorFinder"

// Disabled, since this should only be run on special occasions
xdescribe("real data contributor information", () => {
  beforeEach(() => {
    process.env.GITHUB_TOKEN = "YO, THIS HAS TO BE YOUR TOKEN"
  })

  it("correctly counts contributors for iron jacamar", async () => {
    const answer = await getContributors("quarkiverse", "quarkus-ironjacamar")
    console.log("answer", answer)
    // This expectation will change over time, obviously
    expect(answer).toEqual(expect.arrayContaining([{
      "contributions": 145,
      "login": "gastaldi",
      "name": "George Gastaldi"
    }]))
  })
})
