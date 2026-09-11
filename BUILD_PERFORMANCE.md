# Making local builds painless

Notes from an investigation on 2026-09-11 into why local builds hang, and what to do about it.
Registry figures below were measured against the live
`https://registry.quarkus.io/client/extensions/all` on that date.

## TL;DR

The pain is the **data pipeline**, not Gatsby. A cold build makes roughly 12,000 network
round trips, ~4,700 of them against a GitHub GraphQL budget of 5,000 points/hour, so hitting
the rate limiter is designed in rather than bad luck. On top of that, several retry paths have
uncapped exponential backoff that can stall a build for hours on a single dead URL.

Recommended order of work: **1 + 4 immediately, then 2, then 3.** 1 and 4 are now done; 2 is the
big remaining win. Treat the data/build split (the genuinely valuable half of the Roq idea) as a
separate piece of work from any SSG rewrite.

## Diagnosis

### The "hang" is usually not the rate limiter

A representative stuck build showed repeated warnings for `TimefoldAI/timefold-solver-enterprise`
with `remaining: 4991 → 4985` — i.e. 4,985 of 5,000 points still available. Not throttled.

That repo is private or deleted, so GitHub returns `repository: null`. This makes
`getIssueInformationNoCache` produce `issues === undefined`, which falls into `maybeIssuesUrl`
(`plugins/github-enricher/issue-count-helper.js:112`) → `urlExist` → `isRedirectToPulls`, which
retries against **unauthenticated** github.com using:

```js
// plugins/github-enricher/issue-count-helper.js:12
const RETRY_OPTIONS = { retries: 5, minTimeout: 75 * 1000, factor: 5 }
```

That is 75s → 375s → 1875s → 9375s → 46875s: **worst case ~16 hours on a single URL**.
Unauthenticated github.com HEAD requests are 429'd readily, which is exactly the trigger.

`DONT_WAIT` does not help here. It only guards the GraphQL retry in
`plugins/github-enricher/github-helper.js:17`, so `npm run develop:quickly` does **not**
short-circuit this path.

### Related defects in the same area

- **No negative caching.** `PersistableCache.dump()` (`src/persistable-cache.js`) skips falsy
  values, so `undefined` results are never persisted. Every dead repo is re-fetched *and*
  re-validated on every build, forever.
- **No fetch timeout anywhere.** `tolerantFetch` calls bare `fetch()` with no `AbortSignal`.
  A stalled socket hangs indefinitely with no change to the spinner — which reads as "hang"
  rather than "slow".
- **Unguarded destructure.** `plugins/github-enricher/issue-count-helper.js:105` reads
  `body.data.search.nodes.length` without optional chaining; it crashes outright if that
  query fails.
- **Second uncapped backoff.** `plugins/github-enricher/github-helper.js:2` uses
  `{ retries: 3, minTimeout: 75_000, factor: 3 }` — ~16 minutes per failing query.

### Why it degrades a few days after each fix

There are **1,264 extensions across only 168 distinct GitHub repos**, but the caches are keyed
per *extension*, not per *repo*:

| Query | Cache key | Approx. calls |
|---|---|---|
| Issue info | `owner-name-artifactId` | ~1,135 |
| Metadata path (9 tree lookups per query) | `groupId:artifactId` | ~1,135 |
| Samples path | `groupId:artifactId` | ~1,135 |
| Contributors | `org:project+path` | ~1,135 |
| Images | `scmUrl` | 168 (already deduped) |

Roughly 4,700 GraphQL calls against a 5,000-point budget.

Beyond GitHub, a cold build also does ~5,000 Maven requests, 1,264 javadoc.io probes,
1,023 `urlExist` guide checks (`src/components/util/guide-url-rewriter.js:9`, plus up to eight
more transform attempts each when a guide is dead), and 486 full icon downloads
(`src/data/image-validation.js`). **The last two have no cache at all** and hit the network on
every build regardless of cache state.

Cache TTLs run 0.8–5 days, which is why fixes appear to work and then stop working.

> Note on the earlier 6 → 1 month change to `numMonthsForContributions`
> (`plugins/github-enricher/sponsorFinder.js:9`): it cut the *size* of contributor responses
> but not the *number* of calls, which is why it helped only briefly.

## Options

### 1. Short-circuit, timeouts and negative caching — DONE

*Hours saved; roughly half a day of work.*

- ✅ Capped `maxTimeout` on both retry configs. The `isRedirectToPulls` worst case goes from
  ~16 hours to 40 seconds; the GraphQL one from ~16 minutes to ~10.
- ✅ Added `AbortSignal.timeout()` to every GitHub fetch (30s), and a timeout around the
  `url-exist` and `follow-redirect-url` checks (15s), neither of which takes one of its own.
- ✅ Negative caching, via a shared `ABSENT` marker (`src/absent.js`). GitHub saying `NOT_FOUND`
  is a real answer, so it is persisted and not asked again; a rate limit or timeout is not, so it
  stays in memory for the current build only and is retried on the next one.
- ✅ Skip issue-url validation entirely when GitHub did not answer — this is the actual hang.
- ✅ A whole-build GitHub budget, `GITHUB_BUDGET_MINUTES`, defaulting to 20 minutes locally and
  unlimited in CI. Once spent, the build finishes with what it has; the cache keeps what was
  fetched, so successive builds warm it up incrementally.
- ✅ Capped the rate-limit sleep, which could previously block for a full hour, at the budget
  remaining.
- ✅ Deduplicated the repeated warnings, so one dead repo produces one line rather than one per
  extension in it.
- ✅ Fixed the unguarded destructure at `issue-count-helper.js:105`.

### 2. Dedupe per-repo instead of per-extension

*The biggest structural win; roughly 1–2 days.*

- Fetch the full repo tree once per repo and match extension paths locally, instead of nine
  speculative tree lookups per extension.
- Fetch commit history once per repo and bucket by path in memory.
- Merge images + metadata + samples + issues into one aliased GraphQL query per repo.

**~4,700 calls → ~200.** A cold build then fits inside a single rate-limit window with room to
spare, with no loss of data.

### 3. Shareable cache seeding

*Cheap; large contributor win.*

Nightly CI already builds a warm `.cache-github-api`. Upload it as an artifact (or push it to a
`data` branch) and add `npm run seed-cache` to pull it down, so contributors start warm instead
of cold. Audit the dump for credentials first — it should contain public data only.

### 4. Minimal dev build — DONE

*Trivial; done separately in "Add options for faster local builds".*

UI work does not need 1,264 real extensions.

- ✅ `EXTENSION_LIMIT=50` slices the extensions array in `sourceNodes`.
- ✅ `SKIP_ENRICHMENT=true` stubs out the GitHub plugin entirely.
- ✅ `npm run develop:very-quickly` sets those two and `DONT_WAIT` together.

### 5. Roq migration

Worth decoupling from this problem. The pain is ~95% data fetching and ~5% Gatsby. Rewriting
1,264 pages of React (recharts dashboards, react-select filtering, the sharp image pipeline)
into Qute is a months-long project that would not make the GitHub API any faster.

The genuinely valuable half of the idea is **moving data fetching into a scheduled workflow**
that commits a single JSON blob, so site builds make zero API calls. That is worth doing on
Gatsby now, independent of any SSG decision — and if Roq is wanted later, the hard part would
already be solved.
