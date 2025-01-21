import * as React from "react"
import { graphql } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"
import { initialiseDisplayModeFromLocalStorage } from "../components/util/dark-mode-helper"

const NotFoundPage = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata.title

  const isLookingForNewExtensions = location.pathname && location.pathname.includes("/new-extensions/")
  const isPast = location.pathname && location.pathname.includes("/new-extensions/201")
  const isFuture = location.pathname && location.pathname.includes("/new-extensions/202")

  let message
  if (isLookingForNewExtensions) {
    const date = location.pathname.replaceAll("/new-extensions/", "").split("/").reverse().join(" ")
    const explanation = isPast ? `No Quarkus extensions were released in ${date}.` : isFuture ? `The Quarkus extensions for ${date} haven't been created yet.` : `There are no Quarkus extensions for ${date}.`
    message = "Quarkus contributors can do a lot of nifty things, but time travel isn't one of them. " + explanation
  } else {
    message = "You just hit a route that does not exist... the sadness."
  }

  return (
    <Layout location={location} title={siteTitle}>
      <h1>404: Not Found</h1>
      <p>{message}</p>
    </Layout>
  )
}

export const Head = () => {
  initialiseDisplayModeFromLocalStorage()
  return <Seo title="404: Not Found" />
}

export default NotFoundPage

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
  }
`
