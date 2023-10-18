import {
  clearCaches,
  findSponsor,
  findSponsorFromContributorList,
  getContributors,
  initSponsorCache,
  normalizeCompanyName,
  setMinimumContributionCount,
  setMinimumContributionPercent,
  setMinimumContributorCount,
} from "./sponsorFinder"
import { queryRest } from "./github-helper"

const { queryGraphQl, getRawFileContents } = require("./github-helper")

jest.mock("./github-helper")

const urls = {}

// Mock users (for contributor lists)

const exampleContributor = {
  login: "a-person",
  company: "Red Hat",
  contributions: 9,
}

const anotherContributor = {
  login: "another-contributor",
  company: "Another Company",
  contributions: 9,
}

const occasionalContributor = {
  login: "occasional-contributor",
  company: "Occasional Company",
  contributions: 44,
}

const pactContributors = [
  {
    login: "a-person",
    company: "@RedHatOfficial",
    contributions: 68,
  },
  {
    login: "dependabot[bot]",
    site_admin: false,
    contributions: 27,
  },
  {
    login: "actions-user",
    contributions: 21,
  },
  {
    login: "allcontributors[bot]",
    contributions: 10,
  },
  {
    login: "gastaldi",
    contributions: 5,
  },
  {
    login: "michalvavrik",
    contributions: 1,
  },
]

const companyWithASingleContributor = "Company With A Single Contributor"

const manyContributors = [
  occasionalContributor,
  occasionalContributor,
  {
    login: "solo-contributor",
    company: companyWithASingleContributor,
    contributions: 109,
  },
  {
    login: "a-person",
    company: "Red Hat",
    contributions: 33,
  },
  {
    login: "dependabot[bot]",
    contributions: 27,
  },
  anotherContributor,
  exampleContributor,
  anotherContributor,
  anotherContributor,
  anotherContributor,
  anotherContributor,
  exampleContributor,
  {
    login: "another-contributor",
    company: "Another Company",
    contributions: 19,
  },
  {
    login: "redhat-employee",
    company: "@RedHatOfficial",
    contributions: 9,
  },
]

const anotherContributors =
  [
    {
      login: "redhat-employee",
      company: "@RedHatOfficial",
      contributions: 68,
    },
  ]

// Mock company information

urls["users/redhatofficial"] = {
  login: "RedHatOfficial",
  type: "Organization",
  name: "Red Hat",
  company: null,
}

const frogNode = {
  "node": {
    "author": {
      "user": {
        "login": "someonewhoribbits",
        "company": "Red Hat"
      }
    }
  }
}
const rabbitNode = {
  "node": {
    "author": {
      "user": {
        "login": "someonebouncy",
        "name": "Doctor Fluffy",
        "company": "Rabbit",
        "url": "http://profile"
      }
    }
  }
}

const tortoiseNode = {
  "node": {
    "author": {
      "user": {
        "login": "a-name",
        "company": "Tortoise"
      }
    }
  }
}

const nullUserNode = {
  "node": {
    "author": {
      "user": null
    }
  }
}

const graphQLResponse = {
  "data": {
    "repository": {
      "defaultBranchRef": {
        "target": {
          "history": {
            "edges": [
              rabbitNode, tortoiseNode, frogNode, tortoiseNode, rabbitNode, rabbitNode, rabbitNode, rabbitNode, nullUserNode, frogNode, frogNode
            ]
          }
        }
      }
    }
  }
}

// Every company in our tests should be in this file or we will filter them out
const namedSponsorsOptIn = "named-sponsors:\n" +
  "  - Red Hat\n" +
  "  - Another Company\n" +
  "  - Occasional Company\n" +
  `  - ${companyWithASingleContributor}\n` +
  "  - Tortoise\n" +
  "  - Rabbit\n" +
  "  - Frog\n"

describe("the github sponsor finder", () => {
  beforeAll(async () => {
    setMinimumContributorCount(1)

    getRawFileContents.mockResolvedValue(namedSponsorsOptIn)

    queryGraphQl.mockResolvedValue(graphQLResponse)

    queryRest.mockImplementation(url => Promise.resolve(
      urls[url] || urls[url.toLowerCase()] || {})
    )
  })

  beforeEach(async () => {
    clearCaches()
    await initSponsorCache()
  })

  afterAll(() => {
    jest.resetAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("identifying a sponsor", () => {

    it("does not make remote calls if the org is undefined", async () => {
      const sponsor = await findSponsor(undefined, "quarkus-pact")
      expect(sponsor).toBeUndefined()
      expect(queryRest).not.toHaveBeenCalled()
      expect(queryGraphQl).not.toHaveBeenCalled()
    })

    it("does not make remote calls if the project is undefined", async () => {
      const sponsor = await findSponsor("someorg", undefined)
      expect(sponsor).toBeUndefined()
      expect(queryRest).not.toHaveBeenCalled()
      expect(queryGraphQl).not.toHaveBeenCalled()
    })

    it("returns a list of company sponsors, given an org and project", async () => {
      setMinimumContributionCount(1)
      const sponsor = await findSponsor("someorg", "someproject")
      expect(queryGraphQl).toHaveBeenCalled()
      expect(sponsor).toContain("Red Hat")
    })

    it("orders company sponsors by contribution level", async () => {
      setMinimumContributionCount(1)
      setMinimumContributorCount(1)
      setMinimumContributionPercent(1)
      const sponsor = await findSponsor("someorg", "someproject")
      expect(queryGraphQl).toHaveBeenCalled()
      expect(sponsor).toStrictEqual(["Rabbit", "Red Hat", "Tortoise"])
    })

    it("filters out companies which do not have enough contributors", async () => {
      setMinimumContributionCount(10)
      const sponsor = await findSponsor("someorg", "someproject")
      expect(queryGraphQl).toHaveBeenCalled()
      expect(sponsor).toBeUndefined()
    })

    // Convenience tests for the logic which takes an array of contributor counts and turns it into a list of sponsors
    describe("when the contributor counts have already been collated", () => {

      beforeAll(() => {
        setMinimumContributionCount(5)
      })

      beforeEach(async () => {
        clearCaches()
        await initSponsorCache()
      })

      it("caches repo information", async () => {
        const sponsor = await findSponsorFromContributorList(pactContributors)
        expect(sponsor).not.toBeUndefined()
        const callCount = queryGraphQl.mock.calls.length + queryRest.mock.calls.length
        const secondSponsor = await findSponsorFromContributorList(pactContributors)
        expect(secondSponsor).toStrictEqual(sponsor)
        // No extra calls should be made as everything should be cached
        expect(queryGraphQl.mock.calls.length + queryRest.mock.calls.length).toBe(callCount)
      })

      it("sorts by number of commits", async () => {
        setMinimumContributorCount(0)
        setMinimumContributionPercent(10)

        const sponsors = await findSponsorFromContributorList(manyContributors)

        expect(sponsors.slice(0, 4)).toStrictEqual([
          companyWithASingleContributor,
          "Occasional Company",
          "Another Company",
          "Red Hat",
        ])
      })

      it("excludes companies which only have a single contributor", async () => {
        // Other tests may set this differently, so set it to the value this test expects
        setMinimumContributorCount(0)
        setMinimumContributionPercent(20)

        let sponsors = await findSponsorFromContributorList(manyContributors)
        expect(sponsors).toContain("Occasional Company")
        expect(sponsors).toContain(companyWithASingleContributor)

        // Now put in a higher threshold for the number of contributors
        setMinimumContributorCount(2)
        sponsors = await findSponsorFromContributorList(manyContributors)
        expect(sponsors).toContain("Occasional Company")
        expect(sponsors).not.toContain(companyWithASingleContributor)

      })
    })

    describe("when there is a narrow opt-in list", () => {
      beforeEach(() => {
        setMinimumContributorCount(0)
        setMinimumContributionPercent(5)

        getRawFileContents.mockResolvedValue("named-sponsors:\n" +
          "  - Red Hat"
        )
      })

      afterAll(() => {
        getRawFileContents.mockResolvedValue(namedSponsorsOptIn)
      })

      it("filters out companies that are not in the opt-in list", async () => {
        let sponsors = await findSponsorFromContributorList(manyContributors)
        expect(sponsors).toStrictEqual(["Red Hat"])
      })
    })


    describe("when the main user has linked to a github company account", () => {
      beforeAll(() => {
        setMinimumContributorCount(1)
      })

      beforeEach(async () => {
        clearCaches()
        await initSponsorCache()
      })

      it("returns a company name", async () => {
        const sponsor = await findSponsorFromContributorList(pactContributors)
        expect(sponsor).toStrictEqual(["Red Hat"])
      })

      it("caches company information", async () => {
        const sponsor = await findSponsorFromContributorList(pactContributors)
        expect(sponsor).not.toBeUndefined()
        const callCount = queryGraphQl.mock.calls.length + queryRest.mock.calls.length
        const secondSponsor = await findSponsorFromContributorList(anotherContributors)
        expect(secondSponsor).toStrictEqual(sponsor)
        // No extra remote calls, since we passed in the contributor list and the company is cached
        expect(queryGraphQl.mock.calls.length + queryRest.mock.calls.length).toBe(callCount)
      })
    })


    describe("when the main user is a bot", () => {

      const contributors = [
        {
          login: "dependabot[bot]",
          company: "Irrelevant",
          contributions: 27,
        },
      ]

      beforeAll(() => {
        setMinimumContributorCount(1)
      })

      it("does not return a name", async () => {
        const sponsor = await findSponsorFromContributorList(contributors)
        expect(sponsor).toBeUndefined()
      })
    })

    describe("when the main user is the actions user", () => {
      // The Actions User users/actions-user is not flagged as a bot, but we want to exclude it

      const contributors = [
        {
          login: "actions-user",
          name: "Actions User",
          company: "GitHub Actions",
          contributions: 27,
        },
      ]

      beforeAll(() => {
        setMinimumContributorCount(1)
      })

      it("does not return a name", async () => {
        const sponsor = await findSponsorFromContributorList(contributors)
        expect(sponsor).toBeUndefined()
      })
    })

    describe("when the main user is the quarkiverse bot", () => {
      const contributors =
        [
          {
            login: "quarkiversebot",
            name: "Unflagged bot",
            company: "Quarkiverse Hub",
            contributions: 27,
          },
        ]

      it("does not return a name", async () => {
        const sponsor = await findSponsorFromContributorList(contributors)
        expect(sponsor).toBeUndefined()
      })
    })
  })
  describe("company name normalization", () => {
    beforeEach(async () => {
      clearCaches()
      await initSponsorCache()
    })

    it("handles the simple case", async () => {
      const name = "Atlantic Octopus Federation"
      const sponsor = await normalizeCompanyName(name)
      expect(sponsor).toBe(name)
    })

    it("gracefully handles undefined", async () => {
      const sponsor = await normalizeCompanyName(undefined)
      expect(sponsor).toBeUndefined()
    })

    it("normalises a company name with Inc at the end", async () => {
      const sponsor = await normalizeCompanyName("Red Hat, Inc")
      expect(sponsor).toBe("Red Hat")
    })

    it("normalises a company name with Inc. at the end", async () => {
      const sponsor = await normalizeCompanyName("Red Hat, Inc.")
      expect(sponsor).toBe("Red Hat")
    })

    it("normalises a company name with a 'by' structure at the end", async () => {
      const sponsor = await normalizeCompanyName("JBoss by Red Hat by IBM")
      expect(sponsor).toBe("Red Hat")
    })

    it("normalises a company name with an '@' structure at the end", async () => {
      const sponsor = await normalizeCompanyName("Red Hat @kiegroup")
      expect(sponsor).toBe("Red Hat")
    })

    it("normalises a company name with a parenthetical structure at the end", async () => {
      const sponsor = await normalizeCompanyName("Linkare TI (@linkareti)")
      expect(sponsor).toBe("Linkare TI")
    })

    it("normalises a company name with a hyphenated '@' structure at the end", async () => {
      const sponsor = await normalizeCompanyName("Red Hat - @hibernate")
      expect(sponsor).toBe("Red Hat")
    })
  })

  describe("listing all contributors", () => {

    it("does not make remote calls if the org is undefined", async () => {
      const sponsor = await findSponsor(undefined, "quarkus-pact")
      expect(sponsor).toBeUndefined()
      expect(queryRest).not.toHaveBeenCalled()
      expect(queryGraphQl).not.toHaveBeenCalled()
    })

    it("returns a list of individuals, given an org and project", async () => {
      setMinimumContributionCount(1)
      const contributors = await getContributors("someorg", "someproject")
      expect(queryGraphQl).toHaveBeenCalled()
      expect(contributors).toHaveLength(3)
      expect(contributors[0]).toStrictEqual({
        "name": "Doctor Fluffy",
        login: "someonebouncy",
        contributions: 5,
        url: "http://profile"
      })
    })
  })
})