import {
  clearCaches,
  findSponsor,
  findSponsorFromContributorList,
  getContributors,
  initSponsorCache,
  resolveAndNormalizeCompanyName,
  setMinimumContributionPercent,
  setMinimumContributorCount,
} from "./sponsorFinder"
import { queryRest } from "./github-helper"

const { queryGraphQl } = require("./github-helper")

jest.mock("./github-helper")

const urls = {}

const pactContributors = [
  {
    name: "Red Hat",
    contributions: 68,
    contributors: 10
  },
  {
    name: "gastaldi",
    contributions: 5,
    contributors: 1

  },
  {
    name: "michalvavrik",
    contributions: 1,
    contributors: 1
  },
]

const companyWithASingleContributor = "Company With A Single Contributor"

const manyContributors = [
  {
    name: companyWithASingleContributor,
    contributions: 109,
    contributors: 1
  },
  {
    name: "Occasional Company",
    contributions: 59,
    contributors: 2
  },
  {
    name: "Another Company",
    contributions: 49,
    contributors: 3
  },
  {
    name: "Red Hat",
    contributions: 33,
    contributors: 5
  },
]

// Mock company information

urls["users/redhatofficial"] = {
  login: "RedHatOfficial",
  type: "Organization",
  name: "Red Hat",
  company: null,
}

const merger = "a person who did merges"

const frogNode = {
  "node": {
    parents: {
      totalCount: 1
    },
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
    parents: {
      totalCount: 1
    },
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
    parents: {
      totalCount: 1
    },
    "author": {
      "user": {
        "login": "a-name",
        "company": "Tortoise"
      }
    }
  }
}

const frogNodeDifferentCompany = {
  "node": {
    parents: {
      totalCount: 1
    },
    "author": {
      "user": {
        "login": "some-name",
        "company": "Red Hat @somewhere"
      }
    }
  }
}

const linkNodeGitHubIdCompany = {
  "node": {
    parents: {
      totalCount: 1
    },
    "author": {
      "user": {
        "login": "link-name",
        "company": "@RedHatOfficial"
      }
    }
  }
}

const mergeNode = {
  "node": {
    parents: {
      totalCount: 2
    },
    "author": {
      "user": {
        "login": merger,
        "company": "Tortoise"
      }
    }
  }
}

const nullUserNode = {
  "node": {
    parents: {
      totalCount: 1
    },
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
              rabbitNode, tortoiseNode, tortoiseNode, mergeNode, linkNodeGitHubIdCompany, frogNodeDifferentCompany, rabbitNode, rabbitNode, rabbitNode, mergeNode, rabbitNode, nullUserNode, frogNode, frogNode
            ]
          }
        }
      }
    }
  }
}


describe("the github sponsor finder", () => {
  beforeAll(async () => {
    setMinimumContributorCount(1)

    queryGraphQl.mockResolvedValue(graphQLResponse)

    queryRest.mockImplementation(url => {
      if (url.split("@").length > 1 || url.split(" ").length > 1) {
        return Promise.reject("Malformed url: " + url)
      } else
        return Promise.resolve(
          urls[url] || urls[url.toLowerCase()] || {})
    })

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
      const sponsor = await findSponsor("someorg", "someproject")
      expect(queryGraphQl).toHaveBeenCalled()
      expect(sponsor).toContain("Red Hat")
    })

    it("orders company sponsors by contribution level", async () => {
      setMinimumContributorCount(1)
      setMinimumContributionPercent(1)
      const sponsor = await findSponsor("someorg", "someproject")
      expect(queryGraphQl).toHaveBeenCalled()
      expect(sponsor).toStrictEqual(["Rabbit", "Red Hat", "Tortoise"])
    })

    it("filters out companies which do not have enough contributors", async () => {
      setMinimumContributorCount(10)
      const sponsor = await findSponsor("someorg", "someproject")
      expect(queryGraphQl).toHaveBeenCalled()
      expect(sponsor).toBeUndefined()
    })

    // Convenience tests for the logic which takes an array of contributor counts and turns it into a list of sponsors
    describe("when the contributor counts have already been collated", () => {

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
        setMinimumContributionPercent(1)

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
      const sponsor = await resolveAndNormalizeCompanyName(name)
      expect(sponsor).toBe(name)
    })

    it("gracefully handles undefined", async () => {
      const sponsor = await resolveAndNormalizeCompanyName(undefined)
      expect(sponsor).toBeUndefined()
    })

    it("normalises a company name with Inc at the end", async () => {
      const sponsor = await resolveAndNormalizeCompanyName("Red Hat, Inc")
      expect(sponsor).toBe("Red Hat")
    })

    it("normalises a company name with Inc. at the end", async () => {
      const sponsor = await resolveAndNormalizeCompanyName("Red Hat, Inc.")
      expect(sponsor).toBe("Red Hat")
    })

    it("normalises a company name with a 'by' structure at the end", async () => {
      const sponsor = await resolveAndNormalizeCompanyName("JBoss by Red Hat by IBM")
      expect(sponsor).toBe("Red Hat")
    })

    it("normalises a company name with an '@' structure at the end", async () => {
      const sponsor = await resolveAndNormalizeCompanyName("Red Hat @kiegroup")
      expect(sponsor).toBe("Red Hat")
    })

    it("normalises a company name with a parenthetical structure at the end", async () => {
      const sponsor = await resolveAndNormalizeCompanyName("Linkare TI (@linkareti)")
      expect(sponsor).toBe("Linkare TI")
    })

    it("normalises a company name with a hyphenated '@' structure at the end", async () => {
      const sponsor = await resolveAndNormalizeCompanyName("Red Hat - @hibernate")
      expect(sponsor).toBe("Red Hat")
    })

    it("normalises a company name with several comma-separated clauses", async () => {
      // This case is tricky, because we could tokenise on commas, but we only let people have one company, because otherwise the graph could be chaos.
      const sponsor = await resolveAndNormalizeCompanyName("Red Hat, @xlate")
      expect(sponsor).toBe("Red Hat")
    })

    it("normalises a company name with several @-delimited clauses", async () => {
      // This case is also tricky, because we could tokenise on at signs, but we only let people have one company, because otherwise the graph could be chaos.
      const sponsor = await resolveAndNormalizeCompanyName("@bear-metal @Shopify @TuneMyGC")
      expect(sponsor).toBe("bear-metal")
    })

    it("normalises a company name with words after an @-delimited name", async () => {
      // This case is also tricky, because we could tokenise on at signs, but we only let people have one company, because otherwise the graph could be chaos.
      const sponsor = await resolveAndNormalizeCompanyName("@bear-metal and also some other companies, you know?")
      expect(sponsor).toBe("bear-metal")
    })
  })

  describe("listing all contributors", () => {

    it("does not make remote calls if the org is undefined", async () => {
      const sponsor = await findSponsor(undefined, "quarkus-pact")
      expect(sponsor).toBeUndefined()
      expect(queryRest).not.toHaveBeenCalled()
      expect(queryGraphQl).not.toHaveBeenCalled()
    })

    it("returns the time period over which data was analysed", async () => {
      const { numMonthsForContributions } = await getContributors("someorg", "someproject")
      // The months could be 6, or it could be 1, depending on if this is CI or not
      try {
        expect(numMonthsForContributions).toBe(6)
      } catch (e) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(numMonthsForContributions).toBe(1)
      }
    })

    it("returns a list of individuals, given an org and project", async () => {
      const contributors = await getContributors("someorg", "someproject")
      expect(queryGraphQl).toHaveBeenCalled()
      expect(contributors.contributors).toHaveLength(5)
      expect(contributors.contributors[0]).toStrictEqual({
        "name": "Doctor Fluffy",
        login: "someonebouncy",
        contributions: 5,
        url: "http://profile",
        company: "Rabbit"
      })
    })

    it("filters out merge commits", async () => {
      const contributors = await getContributors("someorg", "someproject")
      expect(queryGraphQl).toHaveBeenCalled()
      expect(contributors.contributors).not.toContainEqual(expect.objectContaining({ login: merger }))
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
        const contributors = await getContributors("someorg", "someproject")
        expect(contributors.contributors).toContainEqual(expect.objectContaining({
          login: "link-name",
          company: "Red Hat"
        }))
      })
    })
  })

  describe("listing all contributing companies", () => {

    it("returns a list of companies, given an org and project", async () => {
      const contributors = await getContributors("someorg", "someproject")
      expect(queryGraphQl).toHaveBeenCalled()
      expect(contributors.companies).toHaveLength(3)
      expect(contributors.companies).toContainEqual({
        "name": "Rabbit",
        contributions: 5,
        contributors: 1
      })
    })

    it("sorts companies by contribution count", async () => {
      const contributors = await getContributors("someorg", "someproject")
      expect(queryGraphQl).toHaveBeenCalled()
      expect(contributors.companies).toHaveLength(3)
      expect(contributors.companies[1]).toStrictEqual({
        "name": "Red Hat",
        contributions: 4,
        contributors: 3
      })
      expect(contributors.companies[2]).toStrictEqual({
        "name": "Tortoise",
        contributions: 2,
        contributors: 1
      })
    })
  })

  it("returns last updated information", async () => {
    const contributors = await getContributors("someorg", "someproject")

    expect(contributors).toHaveProperty("lastUpdated")

    const now = Date.now()
    expect(contributors.lastUpdated / now).toBeCloseTo(1)

  })
})