import * as React from "react"
import { graphql } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"
import ExtensionsList from "../components/extensions-list"
import { initialiseDisplayModeFromLocalStorage } from "../components/util/dark-mode-helper"

const Index = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata?.title || `Title`
  const extensions = data.allExtension.nodes
  const categories = data.allCategory.nodes.map(c => c.name)
  const downloadData = data.downloadDataDate

  if (extensions.length === 0) {
    return (
      <Layout location={location} title={siteTitle}>
        <p>No extensions found. Is the Quarkus registry available?</p>
      </Layout>
    )
  }

  return (
    <Layout location={location} title={siteTitle}>
      <ExtensionsList extensions={extensions} categories={categories} downloadData={downloadData} />
    </Layout>
  )
}

export default Index

/**
 * Head export to define metadata for the page
 *
 * See: https://www.gatsbyjs.com/docs/reference/built-in-components/gatsby-head/
 */
export const Head = () => {
  initialiseDisplayModeFromLocalStorage()
  return <Seo title="All extensions" />
}

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allCategory(sort: { fields: [count, name], order: DESC }) {
      nodes {
        name
      }
    }
    
    downloadDataDate( id: {regex: "/.*/g"}) {
      date
    }

    allExtension(sort: { fields: [name], order: DESC }) {
      nodes {
        name
        artifact
        id
        sortableName
        description
        slug
        metadata {
          categories
          keywords
          guide
          status
          unlisted
          maven {
            version
            timestamp
          }
          icon {
            childImageSharp {
              gatsbyImageData(width: 80)
            }
            publicURL
          }
          sourceControl {
            projectImage {
              childImageSharp {
                gatsbyImageData(width: 80)
              }
            }
            ownerImage {
              childImageSharp {
                gatsbyImageData(width: 80)
              }
            }
          }
          downloads {
            rank
          }
        }
        platforms
        isSuperseded
      }
    }
  }
`
