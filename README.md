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

Information is more complete if a GitHub access token is provided. It should only be granted read access. 
Set it as an environment variable called `GITHUB_TOKEN`. (In the CI, this will be provided by the platform.)

In one terminal, run tests
```
npm install
npm run test:watch
```

In another terminal, run the site
```
npm run develop
```

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