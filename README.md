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

## Caching 

The site pulls down a lot of content through the GitHub API. 
A full build of the site will trigger the rate limiter several times. Each time the rate limiter is hit, the build needs to wait an hour for it to roll over.
Because of this, a fresh build could take two or three hours – be prepared! To build more quickly (but with incomplete information), use the `npm run develop:quickly` command.

The build caches GitHub content in a cache in the `.cache-github-api/` directory, so once a build has been done, subsequent builds should be quicker. 
Most cache contents have a lifespan of a few days (with some jitter so everything doesn't expire at once).

In one terminal, run tests
```
npm install
npm run test:watch
```

In another terminal, run the site
```
npm run develop
```

(or `npm run develop:quickly` if you're in a hurry and don't need all the source control data)

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