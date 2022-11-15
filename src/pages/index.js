import * as React from "react"
import { graphql } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"
import ExtensionsList from "../components/extensions-list"

const Index = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata?.title || `Title`
  const extensions = data.allExtension.nodes

  if (extensions.length === 0) {
    return (
      <Layout location={location} title={siteTitle}>
        <p>No extensions found. Is the Quarkus registry available?</p>
      </Layout>
    )
  }

  return (
    <Layout location={location} title={siteTitle}>
      <ExtensionsList extensions={extensions} />
    </Layout>
  )
}

export default Index

/**
 * Head export to define metadata for the page
 *
 * See: https://www.gatsbyjs.com/docs/reference/built-in-components/gatsby-head/
 */
export const Head = () => <Seo title="All extensions" />

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allExtension(sort: { fields: [name], order: DESC }) {
      nodes {
        name
        description
        slug
        metadata {
          categories
          built_with_quarkus_core
          guide
        }
        origins
      }
    }
  }
`
