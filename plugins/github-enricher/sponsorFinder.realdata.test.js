/**
 * This is useful for validating against real data, but needs a GITHUB_TOKEN to be set.
 * It also needs import fetch from "node-fetch"
 * To get current data to check against, visit https://github.com/quarkiverse/quarkus-ironjacamar/graphs/contributors
 * and adjust the slider to 180 days ago.
 *
 */
import { getContributors } from "./sponsorFinder"

jest.setTimeout(15 * 1000)


// Disabled, since this should only be run on special occasions
describe.skip("real data contributor information", () => {
  beforeEach(() => {
    process.env.GITHUB_TOKEN = "YO, THIS HAS TO BE YOUR TOKEN"
  })

  it("correctly counts contributors for iron jacamar", async () => {
    const answer = await getContributors("quarkiverse", "quarkus-ironjacamar")
    // This expectation will change over time, obviously
    expect(answer).toEqual(expect.arrayContaining([{
      "contributions": 145,
      "login": "gastaldi",
      "name": "George Gastaldi"
    }]))
  })
})
