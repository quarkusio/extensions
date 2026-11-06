# Quarkus Extensions Explorer

This site is built using Gatsby, and hosted using GitHub pages.

# Environment setup 

Local development is a Quarkus-like experience, with continuous testing and live reload. 
You will need node and npm set. 

Using nvm is an easy way to manage node versions:
```
brew install nvm
export NVM_DIR="$HOME/.nvm"
  [ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"  # This loads nvm
  [ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"  # This loads nvm bash_completion
```

Check the last two lines against the suggested commands in the output of the `nvm` install. 

```
nvm install 18
nvm use 18
```


# Local development

## Synced data

The Gatsby build does not fetch data from external services. Instead, scheduled workflows run the scripts in `tools/sync` and commit the results as json files in `data/synced/`:

| Workflow | Script | File |
| --- | --- | --- |
| `sync-github.yml` | `npm run sync:github` | `source-control-info.json`, `contributing-companies.json` |
| `sync-downloads.yml` | `npm run sync:downloads` | `download-ranking.json` |
| `sync-maven.yml` | `npm run sync:registry`, then `npm run sync:maven`, then `npm run sync:links` | `registry.json` (the extensions, categories and platforms from the registry), `maven-info.json`, `enriched-links.json` (the javadoc, guide and icon links, and whether each icon is a valid image) |

The `synced-data` plugin reads the GitHub and download files and turns them into graphql nodes. `gatsby-node.js` reads the registry, Maven and link files when it creates the extension nodes. The Maven workflow runs its three scripts in order, because each uses the data from the one before. Only `sync:github` and `sync:downloads` need credentials, so to refresh the data locally, set the environment variables below for the scripts you run:

- `GITHUB_TOKEN` (should only be granted read access)
- `TABLEAU_PERSONAL_ACCESS_TOKEN` and `TABLEAU_SITE`

The build itself makes only two kinds of external call. It downloads the icons (they are validated by the sync, but Gatsby still needs the files), and it fetches a fresh repository image url from GitHub when a stored one has expired (they are signed, and only valid for a few minutes), so `GITHUB_TOKEN` is still useful there. `SEGMENT_KEY` (used for anonymised analytics) is also optional, and the build succeeds if any of these are missing.

Because the build uses a snapshot, a new extension, or a new icon, appears on the site after the next sync, not on the next build. An icon which has not been validated by the sync yet is left out until then.

### Speeding up local builds

A full build is slow, so there are some environment variables which trade completeness for speed. None of these should be set in CI.

- `DONT_WAIT=true` – when running `sync:github`, do not wait for the GitHub rate limiter to roll over; incomplete source control information is used instead.
- `EXTENSION_LIMIT=50` – only process the first 50 extensions from the registry, instead of all of them. Most of the catalog will be missing, and so will anything which depends on it (such as duplicate detection for the extensions which were dropped).
- `SKIP_ENRICHMENT=true` – make the `synced-data` plugin ignore the synced data, so no calls are made to the GitHub API. Extension pages will build, but with no source control or download information: no contributors, sponsors, issue counts, samples, repository images, or download ranking.
- `GITHUB_BUDGET_MINUTES` – change how long `sync:github` is allowed to spend talking to GitHub, or set it to `0` to remove the limit. See [Caching](#caching) below; unlike the others, this one has a default, so you only need it if twenty minutes is the wrong number for you.

## Caching 

The sync tools pull down a lot of content through the GitHub API. 
A full `sync:github` will trigger the rate limiter several times. Each time the rate limiter is hit, the sync needs to wait an hour for it to roll over.
Because of this, a fresh sync could take two or three hours – be prepared! The synced files are committed, so you only need to run it if you want newer data. To sync more quickly (but with incomplete information), set `DONT_WAIT=true`.
If that is still too slow, `npm run develop:very-quickly` ignores the synced GitHub data and only builds a handful of extensions (it sets `DONT_WAIT`, `SKIP_ENRICHMENT` and `EXTENSION_LIMIT` together; `DONT_WAIT` only matters when running the sync).

The sync tools cache GitHub content in a cache in the `.cache-github-api/` directory, so once a sync has been done, subsequent syncs should be quicker. 
Most cache contents have a lifespan of a few days (with some jitter so everything doesn't expire at once).

To stop a cold sync running away, local syncs spend at most 20 minutes talking to GitHub. When that
budget runs out the sync carries on without the rest of the GitHub data, and finishes. Nothing is
wasted: whatever was fetched is still written to the cache, so each sync gets further than the last
and the cache warms up over a few runs rather than one very long one. CI syncs have no budget, since
they want complete data and have the rate limit to themselves.

Set `GITHUB_BUDGET_MINUTES` to change the budget, or to `0` to remove it:
```
GITHUB_BUDGET_MINUTES=5 npm run sync:github
```

In one terminal, run tests
```
npm install
npm run test:watch
```

If `npm install` fails building a native module (for example, `node-libcurl`, which needs a native toolchain), install without running build scripts:
```
npm install --ignore-scripts
```
This is enough to run the unit tests, since they don't depend on the native modules.

In another terminal, run the site
```
npm run develop
```

(or `npm run develop:quickly` if you're in a hurry and don't need all the source control data, or `npm run develop:very-quickly` if you're in a real hurry and are happy with just a slice of the catalog and no source control data at all)

You can then see changes live on http://localhost:8000. 

# Local production-like development 

To do a production build locally, 

```
npm run build
npm run test:int
```

To view the build on http://localhost:9000, run 

```
npm run serve
```

 
# Deploying 

Changes are deployed on merge, after a successful build. 

# Optional: Gatsby CLI 

Optional: If you will be doing a lot of development, you can install the Gatsby CLI

```
npm install -g gatsby-cli@4.14
```

With the CLI installed, you can run the following instead of the npm commands:

```
gatsby clean
gatsby develop
gatsby build
gatsby serve
```