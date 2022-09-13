import * as React from "react"
import { graphql, Link } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"
import { StaticImage } from "gatsby-plugin-image"

const BlogPostTemplate = ({
  data: { previous, next, site, extension },
  location,
}) => {
  const siteTitle = site.siteMetadata?.title || `Title`

  return (
    <Layout location={location} title={siteTitle}>
      <StaticImage
        className="fake-content"
        layout="constrained"
        formats={["auto", "webp", "avif"]}
        src="../images/extension-detail-page.png"
        alt="A dummy extension"
      />
      <article
        className="blog-post"
        itemScope
        itemType="http://schema.org/Article"
      >
        <header>
          <h1 itemProp="headline">{extension.name}</h1>
        </header>
        <hr />
      </article>
      <nav className="blog-post-nav">
        <ul
          style={{
            display: `flex`,
            flexWrap: `wrap`,
            justifyContent: `space-between`,
            listStyle: `none`,
            padding: 0,
          }}
        >
          <li>
            {previous && (
              <Link to={previous.slug} rel="prev">
                ← {previous.name}
              </Link>
            )}
          </li>
          <li>
            {next && (
              <Link to={next.slug} rel="next">
                {next.name} →
              </Link>
            )}
          </li>
        </ul>
      </nav>
    </Layout>
  )
}

export const Head = ({ data: { extension } }) => {
  return <Seo title={extension.name} description={extension.description} />
}

export default BlogPostTemplate

export const pageQuery = graphql`
  query BlogPostBySlug(
    $id: String!
    $previousPostId: String
    $nextPostId: String
  ) {
    site {
      siteMetadata {
        title
      }
    }
    extension(id: { eq: $id }) {
      id
      name
      description
    }
    previous: extension(id: { eq: $previousPostId }) {
      slug
      name
    }
    next: extension(id: { eq: $nextPostId }) {
      slug
      name
    }
  }
`
