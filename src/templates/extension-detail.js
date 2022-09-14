import * as React from "react"
import { graphql, Link } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"
import { StaticImage } from "gatsby-plugin-image"
import styled from "styled-components"

const ExtensionDetails = styled.main`
  margin: 100px;
  display: flex;
  flex-direction: column;
`

const Headline = styled.header`
  height: 160px;
  display: flex;
  flex-direction: row;
  margin-bottom: 62px;
`

const Columns = styled.div`
  display: flex;
  flex-direction: row;
`

const Logo = styled.div`
  width: 220px;
  margin-right: 60px;
  margin-bottom: 25px;
`

const Metadata = styled.div`
  padding-left: 50px;
`

const Documentation = styled.div``

const ExtensionName = styled.div`
  text-align: left;
  font-size: var(--font-size-48);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0;
  color: var(--grey-2);
  text-transform: uppercase;
  opacity: 1;
`

const ExtensionDescription = styled.div`
  color: var(--grey-2);
  text-align: left;
  font-size: var(--font-size-16);
  opacity: 1;
  margin-bottom: 40px;
  margin-top: 10px;
  font-weight: var(--font-weight-bold);
`

const ExtensionCategory = styled.div`
  color: var(--grey-2);
  text-align: left;
  font-size: var(--font-size-16);
  opacity: 1;
  margin-bottom: 10px;
  margin-top: 10px;
`

const DocumentationSection = styled.section`
  margin-top: 20px;
  margin-bottom: 50px;
`

const DocumentationHeading = styled.h2`
  text-transform: uppercase;
  font-weight: var(--font-weight-normal);
  font-size: var(--font-size-24);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--grey-1);
`

const ExtensionDetailTemplate = ({
  data: { extension, previous, next },
  location,
}) => {
  return (
    <Layout location={location}>
      <ExtensionDetails>
        <Headline>
          <Logo>
            <StaticImage
              layout="constrained"
              formats={["auto", "webp", "avif"]}
              src="../images/generic-extension-logo.png"
              alt="The extension logo"
            />
          </Logo>
          <ExtensionName>{extension.name}</ExtensionName>
        </Headline>
        <Columns>
          <Documentation>
            <ExtensionDescription>{extension.description}</ExtensionDescription>
            {extension.metadata.guide && (
              <DocumentationSection>
                <DocumentationHeading>Documentation</DocumentationHeading>
                Make sure to use the{" "}
                <a href={extension.metadata.guide}>documentation</a> to get your
                questions answered.
              </DocumentationSection>
            )}
          </Documentation>
          <Metadata>
            {extension.metadata.categories &&
              extension.metadata.categories.length > 0 && (
                <ExtensionCategory>
                  <p>Category</p>
                  <p>{extension.metadata.categories[0]}</p>
                </ExtensionCategory>
              )}
          </Metadata>
        </Columns>

        <nav className="extension-detail-nav">
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
                <Link to={"/" + previous.slug} rel="prev">
                  ← {previous.name}
                </Link>
              )}
            </li>
            <li>
              {next && (
                <Link to={"/" + next.slug} rel="next">
                  {next.name} →
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </ExtensionDetails>
    </Layout>
  )
}

// TODO how is this used?
export const Head = ({ data: { extension } }) => {
  return <Seo title={extension.name} description={extension.description} />
}

export default ExtensionDetailTemplate

export const pageQuery = graphql`
  query BlogPostBySlug(
    $id: String!
    $previousPostId: String
    $nextPostId: String
  ) {
    extension(id: { eq: $id }) {
      id
      name
      description
      metadata {
        categories
        guide
      }
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
