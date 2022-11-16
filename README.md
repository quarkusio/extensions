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
nvm install 14
nvm use 14
```

Finally, install the Gatsby cli

```
npm install -g gatsby-cli@4.14
```
# Local development

In one terminal, run tests
```
npm install
npm run test:watch
```

In another terminal, run the site
```
gatsby develop
```

You can then see changes live on http://localhost:8000. 

# Local production-like development 

To do a production build locally, 

```
gatsby build
npm run test:int
```

To view the build on http://localhost:9000, run 

```
gatsby serve
```

 
# Deploying 

Changes are deployed on merge, after a successful build. 