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

## Environment variables 

The site pulls data from a range of sources, some of which need credentials. For the full build, set the following environment variables:

- `GITHUB_TOKEN` (this will be automatically set in a GitHub CI, and should only be granted read access)
- `TABLEAU_PERSONAL_ACCESS_TOKEN`
- `TABLEAU_SITE`
- `SEGMENT_KEY` (used for anonymised analytics)

Information is more complete if a these tokens are provided, but the build should still succeed if they are missing. If it fails without them, please raise an issue.
In PR builds, everything except the `GITHUB_TOKEN` will be missing.

### Speeding up local builds

A full build is slow, so there are some environment variables which trade completeness for speed. None of these should be set in CI.

- `DONT_WAIT=true` – do not wait for the GitHub rate limiter to roll over; incomplete source control information is used instead.
- `EXTENSION_LIMIT=50` – only process the first 50 extensions from the registry, instead of all of them. Most of the catalog will be missing, and so will anything which depends on it (such as duplicate detection for the extensions which were dropped).
- `SKIP_ENRICHMENT=true` – stub out the GitHub plugin entirely, so no calls are made to the GitHub API. Extension pages will build, but with no source control information: no contributors, sponsors, issue counts, samples, or repository images.
- `GITHUB_BUDGET_MINUTES` – change how long the build is allowed to spend talking to GitHub, or set it to `0` to remove the limit. See [Caching](#caching) below; unlike the others, this one has a default, so you only need it if twenty minutes is the wrong number for you.

## Caching 

The site pulls down a lot of content through the GitHub API. 
A full build of the site will trigger the rate limiter several times. Each time the rate limiter is hit, the build needs to wait an hour for it to roll over.
Because of this, a fresh build could take two or three hours – be prepared! To build more quickly (but with incomplete information), use the `npm run develop:quickly` command.
If that is still too slow, `npm run develop:very-quickly` skips the GitHub API completely and only builds a handful of extensions (it sets `DONT_WAIT`, `SKIP_ENRICHMENT` and `EXTENSION_LIMIT` together).

The build caches GitHub content in a cache in the `.cache-github-api/` directory, so once a build has been done, subsequent builds should be quicker. 
Most cache contents have a lifespan of a few days (with some jitter so everything doesn't expire at once).

To stop a cold build running away, local builds spend at most 20 minutes talking to GitHub. When that
budget runs out the build carries on without the rest of the GitHub data, and finishes. Nothing is
wasted: whatever was fetched is still written to the cache, so each build gets further than the last
and the cache warms up over a few runs rather than one very long one. CI builds have no budget, since
they want complete data and have the rate limit to themselves.

Set `GITHUB_BUDGET_MINUTES` to change the budget, or to `0` to remove it:
```
GITHUB_BUDGET_MINUTES=5 npm run develop
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