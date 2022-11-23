import * as React from "react"
import { graphql, Link } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"
import { StaticImage } from "gatsby-plugin-image"
import styled from "styled-components"
import BreadcrumbBar from "../components/extensions-display/breadcrumb-bar"
import ExtensionMetadata from "../components/extensions-display/extension-metadata"
import InstallationInstructions from "../components/extensions-display/installation-instructions"
import { prettyPlatformName } from "../components/util/pretty-platform"

const ExtensionDetails = styled.main`
  margin-left: var(--a-boatload-of-space);
  margin-right: var(--a-boatload-of-space);
  margin-top: var(--a-generous-space);
  margin-bottom: var(--a-generous-space);

  display: flex;
  flex-direction: column;
`

const Headline = styled.header`
  height: 160px;
  display: flex;
  flex-direction: row;
  margin-bottom: 62px;
  align-items: center;
`

const UnlistedWarning = styled.header`
  padding-left: var(--a-boatload-of-space);
  background-color: var(--grey-0);
  text-align: left;
  font-size: var(--font-size-24);
  font-weight: var(--font-weight-bold);
  color: var(--grey-2);
  padding-top: var(--a-modest-space);
  padding-bottom: var(--a-modest-space);
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
  flex-grow: 1;
  padding-left: 50px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`

const Documentation = styled.div`
  width: 70%;
`

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

const DocumentationSection = styled.section`
  margin-top: 20px;
  margin-bottom: 50px;
`

const VisibleLink = styled.a`
  &:link {
    color: var(--link);
    text-decoration: underline;
  }

  &:visited {
    color: var(--link-visited);
    text-decoration: underline;
  }
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
  const { name, description, artifact, metadata } = extension
  return (
    <Layout location={location}>
      <BreadcrumbBar name={name} />
      {metadata.unlisted && <UnlistedWarning>Unlisted</UnlistedWarning>}
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
          <ExtensionName>{name}</ExtensionName>
        </Headline>
        <Columns>
          <Documentation>
            <ExtensionDescription>{description}</ExtensionDescription>
            {metadata.guide && (
              <DocumentationSection>
                <DocumentationHeading>Documentation</DocumentationHeading>
                Make sure to use the{" "}
                <VisibleLink href={metadata.guide}>
                  documentation
                </VisibleLink>{" "}
                to get your questions answered.
              </DocumentationSection>
            )}
            <DocumentationSection>
              <DocumentationHeading>Installation</DocumentationHeading>
              <InstallationInstructions artifact={artifact} />
            </DocumentationSection>
          </Documentation>
          <Metadata>
            <ExtensionMetadata
              data={{
                name: "Version",
                text: metadata.maven?.version,
              }}
            />
            <ExtensionMetadata
              data={{
                name: "Status",
                metadata,
              }}
            />
            <ExtensionMetadata
              data={{
                name: "Category",
                fieldName: "categories",
                metadata,
              }}
            />
            <ExtensionMetadata
              data={{
                name: "Platform",
                plural: "Platforms",
                fieldName: "platforms",
                metadata: extension, // ugly, but we need to get it out of the top level, not the metadata
                // Strip out
                transformer: element =>
                  element !== "quarkus-non-platform-extensions"
                    ? prettyPlatformName(element)
                    : null,
              }}
            />
            <ExtensionMetadata
              data={{
                name: "Maven Central",
                text: metadata.maven?.version,
                url: metadata.maven?.url,
                transformer: text => "Version " + text,
              }}
            />
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
      artifact
      metadata {
        status
        categories
        guide
        unlisted
        maven {
          version
          url
        }
      }
      platforms
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
