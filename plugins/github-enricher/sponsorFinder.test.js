import {
  clearCaches,
  findSponsor,
  setMinimumContributorCount,
} from "./sponsorFinder"

require("jest-fetch-mock").enableMocks()

const urls = {}
urls["https://api.github.com/repos/quarkiverse/quarkus-pact/contributors"] = [
  {
    login: "holly-cummins",
    url: "https://api.github.com/users/holly-cummins",
    type: "User",
    site_admin: false,
    contributions: 68,
  },
  {
    login: "dependabot[bot]",
    url: "https://api.github.com/users/dependabot%5Bbot%5D",
    type: "Bot",
    site_admin: false,
    contributions: 27,
  },
  {
    login: "actions-user",
    url: "https://api.github.com/users/actions-user",
    type: "User",
    site_admin: false,
    contributions: 21,
  },
  {
    login: "allcontributors[bot]",
    url: "https://api.github.com/users/allcontributors%5Bbot%5D",
    type: "Bot",
    contributions: 10,
  },
  {
    login: "gastaldi",
    url: "https://api.github.com/users/gastaldi",
    type: "User",
    site_admin: false,
    contributions: 5,
  },
  {
    login: "michalvavrik",
    url: "https://api.github.com/users/michalvavrik",
    type: "User",
    site_admin: false,
    contributions: 1,
  },
]

urls[
  "https://api.github.com/repos/quarkiverse/quarkus-many-contributors/contributors"
] = [
  {
    login: "occasional-contributor",
    url: "https://api.github.com/users/occasional-contributor",
    type: "User",
    site_admin: false,
    contributions: 15,
  },
  {
    login: "occasional-contributor",
    url: "https://api.github.com/users/occasional-contributor",
    type: "User",
    site_admin: false,
    contributions: 44,
  },
  {
    login: "solo-contributor",
    url: "https://api.github.com/users/solo-contributor",
    type: "User",
    site_admin: false,
    contributions: 9,
  },
  {
    login: "holly-cummins",
    url: "https://api.github.com/users/holly-cummins",
    type: "User",
    site_admin: false,
    contributions: 33,
  },
  {
    login: "dependabot[bot]",
    url: "https://api.github.com/users/dependabot%5Bbot%5D",
    type: "Bot",
    site_admin: false,
    contributions: 27,
  },
  {
    login: "another-contributor",
    url: "https://api.github.com/users/another-contributor",
    type: "User",
    site_admin: false,
    contributions: 9,
  },
  {
    login: "holly-cummins",
    url: "https://api.github.com/users/holly-cummins",
    type: "User",
    site_admin: false,
    contributions: 9,
  },
  {
    login: "another-contributor",
    url: "https://api.github.com/users/another-contributor",
    type: "User",
    site_admin: false,
    contributions: 9,
  },
  {
    login: "another-contributor",
    url: "https://api.github.com/users/another-contributor",
    type: "User",
    site_admin: false,
    contributions: 9,
  },
  {
    login: "another-contributor",
    url: "https://api.github.com/users/another-contributor",
    type: "User",
    site_admin: false,
    contributions: 9,
  },
  {
    login: "another-contributor",
    url: "https://api.github.com/users/another-contributor",
    type: "User",
    site_admin: false,
    contributions: 9,
  },
  {
    login: "holly-cummins",
    url: "https://api.github.com/users/holly-cummins",
    type: "User",
    site_admin: false,
    contributions: 9,
  },
  {
    login: "another-contributor",
    url: "https://api.github.com/users/another-contributor",
    type: "User",
    site_admin: false,
    contributions: 19,
  },
  {
    login: "redhat-employee",
    url: "https://api.github.com/users/redhat-employee",
    type: "User",
    site_admin: false,
    contributions: 9,
  },
]

urls[
  "https://api.github.com/repos/quarkiverse/quarkus-pact-same-user/contributors"
] = [
  {
    login: "holly-cummins",
    url: "https://api.github.com/users/holly-cummins",
    type: "User",
    site_admin: false,
    contributions: 68,
  },
]

urls["https://api.github.com/repos/quarkiverse/another-project/contributors"] =
  [
    {
      login: "redhat-employee",
      url: "https://api.github.com/users/redhat-employee",
      type: "User",
      site_admin: false,
      contributions: 68,
    },
  ]

urls["https://api.github.com/users/holly-cummins"] = {
  login: "holly-cummins",
  type: "User",
  name: "Holly Cummins",
  company: "@RedHatOfficial",
}

urls["https://api.github.com/users/redhat-employee"] = {
  login: "redhat-employee",
  type: "User",
  name: "A Red Hat Employee",
  company: "@RedHatOfficial",
}

urls["https://api.github.com/users/occasional-contributor"] = {
  login: "occasional-contributor",
  type: "User",
  company: "Occasional Company",
}

urls["https://api.github.com/users/solo-contributor"] = {
  login: "solo-contributor",
  type: "User",
  company: "Company With A Single Contributor",
}

urls["https://api.github.com/users/another-contributor"] = {
  login: "another-contributor",
  type: "User",
  company: "Another Company",
}

urls["https://api.github.com/users/dependabot%5Bbot%5D"] = {
  login: "whatever",
  type: "Bot",
  name: "A happy little automation",
  company: "Should Not Be Returned",
}

urls["https://api.github.com/users/redhatofficial"] = {
  login: "RedHatOfficial",
  type: "Organization",
  site_admin: false,
  name: "Red Hat",
  company: null,
}

describe("the github sponsor finder", () => {
  beforeAll(async () => {
    setMinimumContributorCount(1)

    fetch.mockImplementation(url =>
      Promise.resolve({
        json: jest
          .fn()
          .mockResolvedValue(urls[url] || urls[url.toLowerCase()] || {}),
      })
    )
  })

  beforeEach(() => {
    clearCaches()
  })

  afterAll(() => {
    delete process.env.GITHUB_TOKEN
    fetch.resetMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("does not make fetch calls if the org is undefined", async () => {
    const sponsor = await findSponsor(undefined, "quarkus-pact")
    expect(sponsor).toBeUndefined()
    expect(fetch).not.toHaveBeenCalled()
  })

  it("does not make fetch calls if the project is undefined", async () => {
    const sponsor = await findSponsor("someorg", undefined)
    expect(sponsor).toBeUndefined()
    expect(fetch).not.toHaveBeenCalled()
  })

  it("caches repo information", async () => {
    const sponsor = await findSponsor("quarkiverse", "quarkus-pact")
    expect(sponsor).not.toBeUndefined()
    const callCount = fetch.mock.calls.length
    const secondSponsor = await findSponsor("quarkiverse", "quarkus-pact")
    expect(secondSponsor).toBe(sponsor)
    // No extra calls should be made as everything should be cached
    expect(fetch.mock.calls.length).toBe(callCount)
  })

  it("caches user information", async () => {
    const sponsor = await findSponsor("quarkiverse", "quarkus-pact")
    expect(sponsor).not.toBeUndefined()
    const callCount = fetch.mock.calls.length
    const secondSponsor = await findSponsor(
      "quarkiverse",
      "quarkus-pact-same-user"
    )
    expect(secondSponsor).toStrictEqual(sponsor)
    // One extra call for the repo, but no calls for the user
    expect(fetch.mock.calls.length).toBe(callCount + 1)
  })

  // This test is quite sensitive to the minimum proportion of commits we set for a company to be counted as a lead
  it("sorts by number of commits", async () => {
    const sponsors = await findSponsor(
      "quarkiverse",
      "quarkus-many-contributors"
    )

    expect(sponsors.slice(0, 3)).toStrictEqual([
      "Another Company",
      "Red Hat",
      "Occasional Company",
    ])
  })

  it("excludes companies which only have a single contributor", async () => {
    // Other tests may set this differently, so set it to the value this test expects
    setMinimumContributorCount(2)
    const sponsors = await findSponsor(
      "quarkiverse",
      "quarkus-many-contributors"
    )

    expect(sponsors).toStrictEqual([
      "Another Company",
      "Red Hat",
      "Occasional Company",
    ])
  })

  describe("when the main user has linked to a github company account", () => {
    beforeAll(() => {
      setMinimumContributorCount(1)
    })

    it("returns a company name", async () => {
      const sponsor = await findSponsor("quarkiverse", "quarkus-pact")
      expect(fetch).toHaveBeenCalled()
      expect(sponsor).toStrictEqual(["Red Hat"])
    })

    it("caches company information", async () => {
      const sponsor = await findSponsor("quarkiverse", "quarkus-pact")
      expect(sponsor).not.toBeUndefined()
      const callCount = fetch.mock.calls.length
      const secondSponsor = await findSponsor("quarkiverse", "another-project")
      expect(secondSponsor).toStrictEqual(sponsor)
      // One extra call for the repo, one extra call for the user, but no calls for the company
      expect(fetch.mock.calls.length).toBe(callCount + 2)
    })
  })

  describe("when the main user has linked to a company name", () => {
    beforeAll(() => {
      setMinimumContributorCount(1)
      urls["https://api.github.com/users/holly-cummins"] = {
        login: "holly-cummins",
        name: "Holly Cummins",
        type: "User",
        company: "Red Hat",
      }
    })

    beforeEach(() => {
      clearCaches()
    })

    it("returns the company name", async () => {
      const sponsor = await findSponsor("quarkiverse", "quarkus-pact")
      expect(fetch).toHaveBeenCalled()
      expect(sponsor).toStrictEqual(["Red Hat"])
    })
  })

  describe("when the main user has linked to a company name in an unexpected format", () => {
    beforeEach(() => {
      setMinimumContributorCount(1)
      clearCaches()
    })

    it("normalises a company name with Inc at the end", async () => {
      urls["https://api.github.com/users/holly-cummins"] = {
        login: "holly-cummins",
        name: "Holly Cummins",
        type: "User",
        company: "Red Hat, Inc",
      }

      const sponsor = await findSponsor("quarkiverse", "quarkus-pact")
      expect(fetch).toHaveBeenCalled()
      expect(sponsor).toStrictEqual(["Red Hat"])
    })

    it("normalises a company name with Inc. at the end", async () => {
      urls["https://api.github.com/users/holly-cummins"] = {
        login: "holly-cummins",
        name: "Holly Cummins",
        type: "User",
        company: "Red Hat, Inc.",
      }

      const sponsor = await findSponsor("quarkiverse", "quarkus-pact")
      expect(fetch).toHaveBeenCalled()
      expect(sponsor).toStrictEqual(["Red Hat"])
    })

    it("normalises a company name with a 'by' structure at the end", async () => {
      urls["https://api.github.com/users/holly-cummins"] = {
        login: "holly-cummins",
        name: "Holly Cummins",
        type: "User",
        company: "JBoss by Red Hat by IBM",
      }

      const sponsor = await findSponsor("quarkiverse", "quarkus-pact")
      expect(fetch).toHaveBeenCalled()
      expect(sponsor).toStrictEqual(["Red Hat"])
    })

    it("normalises a company name with an '@' structure at the end", async () => {
      urls["https://api.github.com/users/holly-cummins"] = {
        login: "holly-cummins",
        name: "Holly Cummins",
        type: "User",
        company: "Red Hat @kiegroup",
      }

      const sponsor = await findSponsor("quarkiverse", "quarkus-pact")
      expect(fetch).toHaveBeenCalled()
      expect(sponsor).toStrictEqual(["Red Hat"])
    })

    it("normalises a company name with a parenthetical structure at the end", async () => {
      urls["https://api.github.com/users/holly-cummins"] = {
        login: "holly-cummins",
        name: "Holly Cummins",
        type: "User",
        company: "Linkare TI (@linkareti)",
      }

      const sponsor = await findSponsor("quarkiverse", "quarkus-pact")
      expect(fetch).toHaveBeenCalled()
      expect(sponsor).toStrictEqual(["Linkare TI"])
    })

    it("normalises a company name with a hyphenated '@' structure at the end", async () => {
      urls["https://api.github.com/users/holly-cummins"] = {
        login: "holly-cummins",
        name: "Holly Cummins",
        type: "User",
        company: "Red Hat - @hibernate",
      }

      const sponsor = await findSponsor("quarkiverse", "quarkus-pact")
      expect(fetch).toHaveBeenCalled()
      expect(sponsor).toStrictEqual(["Red Hat"])
    })
  })

  describe("when the main user is a bot", () => {
    beforeAll(() => {
      setMinimumContributorCount(1)
      urls[
        "https://api.github.com/repos/quarkiverse/quarkus-pact/contributors"
      ] = [
        {
          login: "dependabot[bot]",
          url: "https://api.github.com/users/dependabot%5Bbot%5D",
          type: "Bot",
          site_admin: false,
          contributions: 27,
        },
      ]
    })

    beforeEach(() => {
      clearCaches()
    })

    it("does not return a name", async () => {
      const sponsor = await findSponsor("quarkiverse", "quarkus-pact")
      expect(fetch).toHaveBeenCalled()
      expect(sponsor).toBeUndefined()
    })
  })

  describe("when the main user is the actions user", () => {
    // The Actions User https://api.github.com/users/actions-user is not flagged as a bot, but we want to exclude it
    beforeAll(() => {
      // Lazily make these tests pass by setting a lower threshold for users
      setMinimumContributorCount(1)
      urls[
        "https://api.github.com/repos/quarkiverse/actions-only/contributors"
      ] = [
        {
          login: "actions-user",
          url: "https://api.github.com/users/actions-user",
          site_admin: false,
          contributions: 27,
        },
      ]

      urls["https://api.github.com/users/actions-user"] = {
        login: "actions-user",
        name: "Actions User",
        company: "GitHub Actions",
      }
    })

    beforeEach(() => {
      clearCaches()
    })

    it("does not return a name", async () => {
      const sponsor = await findSponsor("quarkiverse", "actions-only")
      expect(fetch).toHaveBeenCalled()
      expect(sponsor).toBeUndefined()
    })
  })

  describe("when the main user is the quarkiverse bot", () => {
    // The Actions User https://api.github.com/users/actions-user is not flagged as a bot, but we want to exclude it
    beforeAll(() => {
      urls["https://api.github.com/repos/quarkiverse/quarkobot/contributors"] =
        [
          {
            login: "quarkiversebot",
            url: "https://api.github.com/users/quarkiversebot",
            site_admin: false,
            contributions: 27,
          },
        ]

      urls["https://api.github.com/users/quarkiversebot"] = {
        login: "quarkiversebot",
        name: "Unflagged bot",
        company: "Quarkiverse Hub",
      }
    })

    beforeEach(() => {
      clearCaches()
    })

    it("does not return a name", async () => {
      const sponsor = await findSponsor("quarkiverse", "quarkobot")
      expect(fetch).toHaveBeenCalled()
      expect(sponsor).toBeUndefined()
    })
  })
})
