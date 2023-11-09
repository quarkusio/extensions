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
import ContributionsChart from "../components/charts/contributions-chart"
import { Tab, TabList, TabPanel, Tabs } from "react-tabs"
import "react-tabs/style/react-tabs.css"
import { getQueryParams, useQueryParamString } from "react-use-query-param-string"

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
  border-radius: 10px;
  overflow: hidden;
`

const Metadata = styled.div`
  flex-grow: 1;
  padding-left: 30px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-content: flex-start;
`

const MainContent = styled.div`
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
  margin-bottom: 3rem;
  margin-top: 2.5rem;
  font-weight: var(--font-weight-bold);
`

const DocumentationSection = styled.section`
  margin-top: 2.5rem;
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
`

//  I wish this wasn't here, but we need to set an explicit height for the charts, or the contents don't render at all
const ChartHolder = styled.div`
  height: 480px; // For now, an arbitrary height, but we should tune
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
  padding-top: 2rem;
`

const Filename = styled.span`
  font-family: monospace;
`

const ClosingRule = styled.div`
  width: 100%;
  position: relative;
  top: -1px;
  padding-left: var(--a-modest-space);
  border-bottom: 1px solid var(--grey-1);`

// Semi-duplicate the tab headings so we get prettier search strings :)
const tabs = ["docs", "community"]

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


  const key = "tab"
  const [searchText, setSearchText, initialized] = useQueryParamString(key, "")

  const onSelect = (index) => {
    setSearchText(tabs[index])
    return true
  }

  // It's a bit odd that this is needed, but the state we read may not reflect what is in the url on first load
  const realSearchText = initialized ? searchText : getQueryParams() ? getQueryParams()[key] : undefined

  const selected = Math.max(tabs.indexOf(realSearchText), 0)

  const extensionYaml = metadata.sourceControl?.extensionYamlUrl ? (
    <a href={metadata.sourceControl.extensionYamlUrl}>quarkus-extension.yaml</a>
  ) : (
    "quarkus-extension.yaml"
  )

  const extensionRootUrl = metadata?.sourceControl?.extensionRootUrl

  // Honour manual overrides of the sponsor
  const sponsors = metadata?.sponsors || metadata?.sponsor || metadata.sourceControl?.sponsors

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
          <MainContent>
            <ExtensionDescription>{description}</ExtensionDescription>

            <Tabs onSelect={onSelect} defaultIndex={selected}>
              <TabList>
                <Tab>Documentation</Tab>
                {metadata?.sourceControl?.contributors && metadata?.sourceControl?.contributors.length > 0 && (
                  <Tab>Community</Tab>)}
              </TabList>

              <TabPanel>

                {metadata.guide && (
                  <DocumentationSection>
                    <DocumentationHeading>Guides</DocumentationHeading>
                    Make sure to use the extension's{" "}
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

                {duplicates && duplicates.length > 0 && (<DocumentationSection>
                  {duplicates.map(duplicate => (
                    <DuplicateReference key={duplicate.groupId}>
                      {/^[aeiou]/i.test(duplicate.relationship) ? "An " : "A "}
                      <Link to={"/" + duplicate.slug}>
                        {duplicate.relationship} version
                      </Link>{" "}
                      of this extension was published with the group id{" "}
                      <MavenCoordinate>{duplicate.groupId}</MavenCoordinate>.
                    </DuplicateReference>
                  ))}
                </DocumentationSection>)}
              </TabPanel>

              {metadata?.sourceControl?.contributors && metadata?.sourceControl?.contributors.length > 0 && (
                <TabPanel>
                  <DocumentationSection>
                    <DocumentationHeading>Recent Contributors</DocumentationHeading>

                    {!extensionRootUrl && (
                      <p>Commits to this extension's repository in the past six months (excluding merge commits).</p>)}
                    {extensionRootUrl && (
                      <p>Commits to <a href={extensionRootUrl}>this extension's source code</a> in the past six months
                        (excluding merge commits).</p>)}

                    <ChartHolder>
                      <ContributionsChart contributors={metadata.sourceControl.contributors}
                                          companies={metadata.sourceControl.companies} baseColour={"#4695EB"}
                                          companyColour={"#666"} />
                    </ChartHolder>

                    {metadata?.sourceControl?.companies && (
                      <p><i>Company affiliations are derived from GitHub user profiles. Want your company's name to be
                        shown in this chart? <a
                          href={"https://hub.quarkiverse.io/checklist/#allow-your-company-to-be-named-as-a-sponsor-or-contributor-optional"}>Opt-in
                          to have it included.</a></i></p>
                    )}

                    {metadata?.sourceControl?.lastUpdated && (
                      <p><i>Commit statistics last
                        updated {new Date(+metadata?.sourceControl?.lastUpdated).toLocaleDateString("en-us", {
                          weekday: "long",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric"
                        })}.</i></p>
                    )}
                  </DocumentationSection>
                </TabPanel>)
              }
            </Tabs>
          </MainContent>

          <Metadata>
            <CodeLink
              unlisted={metadata.unlisted}
              artifact={artifact}
              platforms={platforms}
              streams={streams}
            />

            <ExtensionMetadata
              data={{
                name: "Latest Version",
                text: metadata.maven?.version,
              }}
            />
            <ExtensionMetadata
              data={{
                name: "Publish Date",
                // Count dates of 0 as undefined, so we don't render them
                text: metadata.maven?.timestamp > 0 ? metadata.maven?.timestamp : undefined,
                transformer: timestamp =>
                  timestamp
                    ? format(new Date(+timestamp), "MMM dd, yyyy")
                    : "unknown",
              }}
            />
            <ExtensionMetadata
              data={{
                name: "Group ID",
                text: metadata.maven?.groupId,
              }}
            />
            <ExtensionMetadata
              data={{
                name: "Artifact ID",
                text: metadata.maven?.artifactId,
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
                name: "Sponsor",
                plural: "Sponsors",
                text: sponsors,
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
                  extension.metadata?.sourceControl?.url?.includes("github") ? "github" : extension.metadata?.sourceControl?.url?.includes("gitlab") ?
                    "gitlab" : extension.metadata?.sourceControl?.url?.includes("git")
                      ? "git-alt"
                      : undefined,
                // If we don't have a project name, still show a url label, but if we don't have a url, don't show a label
                text: extension.metadata?.sourceControl?.project
                  ? extension.metadata?.sourceControl?.project
                  : extension.metadata?.sourceControl?.url ? "source" : undefined,
                url: extension.metadata?.sourceControl?.url,
              }}
            />
            <ExtensionMetadata
              data={{
                name: "Issues",
                fieldName: "issues",
                metadata: extension.metadata?.sourceControl,
                url: extension.metadata?.sourceControl?.issuesUrl,
              }}
            />

            <ClosingRule />

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
        sponsor
        sponsors
        icon {
          childImageSharp {
            gatsbyImageData(width: 220)
          }
          publicURL
        }
        maven {
          version
          groupId
          artifactId
          url
          timestamp
        }
        sourceControl {
          url
          project
          issues
          issuesUrl
          sponsors
          lastUpdated
          contributors {
            name
            contributions
            login
            company
            url
          }
          companies {
            name
            contributions
          }
          projectImage {
            childImageSharp {
              gatsbyImageData(width: 220)
            }
          }
          extensionYamlUrl
          extensionRootUrl
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
