import * as React from "react"
import { graphql, Link } from "gatsby"
import { format } from "date-fns"
import Layout from "../components/layout"
import Seo from "../components/seo"
import styled from "styled-components"
import BreadcrumbBar from "../components/extensions-display/breadcrumb-bar"
import ExtensionMetadata from "../components/extensions-display/extension-metadata"
import InstallationInstructions from "../components/extensions-display/installation-instructions"
import ExtensionImage from "../components/extension-image"
import CodeLink from "../components/extensions-display/code-link"
import { qualifiedPrettyPlatform } from "../components/util/pretty-platform"

const ExtensionDetails = styled.main`
  margin-left: var(--site-margins);
  margin-right: var(--site-margins);
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
  padding-left: var(--site-margins);
  background-color: var(--grey-0);
  text-align: left;
  font-size: var(--font-size-24);
  font-weight: var(--font-weight-bold);
  color: var(--grey-2);
  padding-top: var(--a-modest-space);
  padding-bottom: var(--a-modest-space);
`

const SupersededWarning = styled.header`
  padding-left: var(--site-margins);
  background-color: var(--soft-yellow);
  text-align: left;
  font-size: var(--font-size-24);
  font-weight: var(--font-weight-bold);
  padding-top: var(--a-modest-space);
  padding-bottom: var(--a-modest-space);
`

const Columns = styled.div`
  display: flex;
  flex-direction: row;
`

const LogoImage = styled.div`
  width: 220px;
  margin-right: 60px;
  margin-bottom: 25px;
`

const Metadata = styled.div`
  flex-grow: 1;
  padding-left: 30px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-content: flex-start;
`

const Documentation = styled.div`
  width: 70%;
  display: flex;
  flex-direction: column;
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

const DuplicateReference = styled.div``
const MavenCoordinate = styled.span`
  font-weight: var(--font-weight-bold);
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

const Logo = ({ extension }) => {
  return (
    <LogoImage>
      <ExtensionImage extension={extension} size={220} />
    </LogoImage>
  )
}

const AuthorGuidance = styled.div`
  font-style: italic;
`

const Filename = styled.span`
  font-family: monospace;
`

const ExtensionDetailTemplate = ({
  data: { extension, previous, next },
  location,
}) => {
  const {
    name,
    description,
    duplicates,
    isSuperseded,
    artifact,
    metadata,
    platforms,
    streams,
  } = extension

  const extensionYaml = metadata.sourceControl?.extensionYamlUrl ? (
    <a href={metadata.sourceControl.extensionYamlUrl}>quarkus-extension.yaml</a>
  ) : (
    "quarkus-extension.yaml"
  )

  return (
    <Layout location={location}>
      <BreadcrumbBar name={name} />
      {metadata.unlisted && <UnlistedWarning>Unlisted</UnlistedWarning>}
      {isSuperseded &&
        duplicates.map(duplicate => (
          <SupersededWarning key={duplicate.groupId}>
            {/^[aeiou]/i.test(duplicate.relationship) ? "An " : "A "}
            {duplicate.relationship} version of this extension has been released
            with the group id{" "}
            <MavenCoordinate>{duplicate.groupId}</MavenCoordinate>
          </SupersededWarning>
        ))}

      <ExtensionDetails>
        <Headline>
          <Logo extension={extension} />
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

            <DocumentationSection>
              {duplicates &&
                duplicates.map(duplicate => (
                  <DuplicateReference key={duplicate.groupId}>
                    {/^[aeiou]/i.test(duplicate.relationship) ? "An " : "A "}
                    <Link to={"/" + duplicate.slug}>
                      {duplicate.relationship} version
                    </Link>{" "}
                    of this extension was published with the group id{" "}
                    <MavenCoordinate>{duplicate.groupId}</MavenCoordinate>.
                  </DuplicateReference>
                ))}
            </DocumentationSection>

            <DocumentationSection>
              <AuthorGuidance>
                This page was generated from the{" "}
                <a href="https://quarkus.io/version/main/guides/extension-metadata#quarkus-extension-yaml">
                  extension metadata
                </a>{" "}
                published to the{" "}
                <a href="https://quarkus.io/guides/extension-registry-user">
                  Quarkus registry
                </a>
                . Spot a problem? Submit a change to the {name} extension's{" "}
                <Filename>{extensionYaml}</Filename> and this content will be
                updated by the next extension release.
              </AuthorGuidance>
            </DocumentationSection>
          </Documentation>
          <Metadata>
            <CodeLink
              unlisted={metadata.unlisted}
              artifact={artifact}
              platforms={platforms}
              streams={streams}
            />

            <ExtensionMetadata
              data={{
                name: "Version",
                text: metadata.maven?.version,
              }}
            />
            <ExtensionMetadata
              data={{
                name: "Publish Date",
                text: metadata.maven?.timestamp,
                transformer: timestamp =>
                  timestamp
                    ? format(new Date(+timestamp), "MMM dd, yyyy")
                    : "unknown",
              }}
            />
            <ExtensionMetadata
              data={{
                name: "Built with",
                fieldName: "builtWithQuarkusCore",
                metadata,
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
                fieldName: "origins", // We label this 'platform' but include the platform and platform member both, so need to read origins
                metadata: extension, // ugly, but we need to get it out of the top level, not the metadata
                // Strip out
                transformer: element =>
                  /quarkus-non-platform-extensions/.test(element)
                    ? null
                    : qualifiedPrettyPlatform(element),
              }}
            />
            <ExtensionMetadata
              data={{
                name: "Minimum Java version",
                fieldName: "minimumJavaVersion",
                metadata,
              }}
            />
            <ExtensionMetadata
              data={{
                name: "Repository",
                text: "Maven Central", // Hardcode for now, until we need to support other repos
                url: metadata.maven?.url,
              }}
            />
            <ExtensionMetadata
              data={{
                name: "Source code",
                fieldName: "url",
                icon:
                  extension.metadata?.sourceControl?.url?.includes("github") ||
                  extension.metadata?.sourceControl?.url?.includes("gitlab")
                    ? "git-alt"
                    : undefined,
                text: extension.metadata?.sourceControl?.project,
                url: extension.metadata?.sourceControl?.url,
              }}
            />
            <ExtensionMetadata
              data={{
                name: "Issues",
                fieldName: "issues",
                metadata: extension.metadata?.sourceControl,
                url: `${extension.metadata?.sourceControl?.url}/issues`,
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
        builtWithQuarkusCore
        unlisted
        minimumJavaVersion
        icon {
          childImageSharp {
            gatsbyImageData(width: 220)
          }
          publicURL
        }
        maven {
          version
          url
          timestamp
        }
        sourceControl {
          url
          project
          issues
          projectImage {
            childImageSharp {
              gatsbyImageData(width: 220)
            }
          }
          extensionYamlUrl
          ownerImage {
            childImageSharp {
              gatsbyImageData(width: 220)
            }
          }
        }
      }

      platforms
      origins
      streams {
        id
        isLatestThree
        isAlpha
        platformKey
      }
      duplicates {
        relationship
        groupId
        slug
      }
      isSuperseded
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
