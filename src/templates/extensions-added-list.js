import * as React from "react"
import { useState } from "react"

import styled from "styled-components"

import { useMediaQuery } from "react-responsive"
import { device } from "../components/util/styles/breakpoints"
import ExtensionCard from "../components/extension-card"
import { graphql } from "gatsby"
import BreadcrumbBar from "../components/extensions-display/breadcrumb-bar"
import Layout from "../components/layout"
import Sortings from "../components/sortings/sortings"
import { slugForExtensionsAddedMonth } from "../components/util/extension-slugger"
import Link from "gatsby-link"
import { dateFormatOptions } from "../components/util/date-utils"
import { ExtensionCardList } from "../components/extensions-list"

const FilterableList = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;

  // noinspection CssUnknownProperty
  @media ${device.sm} {
    flex-direction: column;
  }
`

const Extensions = styled.ol`
  list-style: none;
  width: 100%;
  padding-inline-start: 0;
  grid-template-rows: repeat(auto-fill, 1fr);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 30px;

  // noinspection CssUnknownProperty
  @media ${device.xs} {
    display: flex;
    flex-direction: column;
  }
`

const CardItem = styled.li`
  height: 100%;
  width: 100%;
  display: flex;
  max-height: 34rem;
`

const InfoSortRow = styled.div`
  display: flex;
  column-gap: var(--a-generous-space);
  justify-content: space-between;
  flex-direction: row;

  // noinspection CssUnknownProperty
  @media ${device.sm} {
    flex-direction: column;
    margin-top: 0;
  }
`

const Heading = styled.h1`
  font-size: 3rem;
  @media screen and (max-width: 768px) {
    font-size: 2rem;
  }
  font-weight: var(--font-weight-boldest);
  margin: 2.5rem 0 1.5rem 0;
  padding-bottom: var(--a-modest-space);
  width: calc(100vw - 2 * var(--site-margins));
  // noinspection CssUnknownProperty
  @media ${device.xs} {
    border-bottom: 1px solid var(--card-outline);
  }
`

const ExtensionCount = styled.h4`
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  font-weight: 400;
  font-style: italic;

  // noinspection CssUnknownProperty
  @media ${device.sm} {
    font-size: var(--font-size-14);
  }
`

const prettyDate = (timestamp) => new Date(+timestamp).toLocaleDateString("en-US", dateFormatOptions)


const ExtensionsAddedListTemplate = (
  {
    data: {
      allExtension, downloadDataDate,
    },
    pageContext: { nextMonthTimestamp, previousMonthTimestamp },
    location,
  }) => {
  const downloadData = downloadDataDate

  // Convert the data to the same format as what the other list page uses
  const { edges } = allExtension
  const extensions = edges.map(e => e.node)

  const [extensionComparator, setExtensionComparator] = useState(() => undefined)

  const isMobile = useMediaQuery({ query: device.sm })

  const nav = (<nav className="extension-detail-nav">
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
        {previousMonthTimestamp && (
          <Link to={"/" + slugForExtensionsAddedMonth(previousMonthTimestamp)} rel="previous">
            ← {prettyDate(previousMonthTimestamp)}
          </Link>
        )}
      </li>
      <li>
        {nextMonthTimestamp && (
          <Link to={"/" + slugForExtensionsAddedMonth(nextMonthTimestamp)} rel="next">
            {prettyDate(nextMonthTimestamp)} →
          </Link>
        )}
      </li>
    </ul>
  </nav>)

  const monthTimestamp = extensions[0].metadata.maven.sinceMonth
  const now = new Date()
  const date = new Date(+monthTimestamp)
  const verb = now.getUTCMonth() === date.getUTCMonth() && now.getUTCFullYear() === date.getUTCFullYear() ? "have been" : "were"

  if (extensions && extensions.length > 0) {

    // Exclude unlisted and superseded extensions from the count, even though we sometimes show them if there's a direct search for it
    const extensionCount = extensions.filter(
      extension => !(extension.metadata.unlisted || extension.isSuperseded)
    ).length

    if (extensionComparator) {
      extensions.sort(extensionComparator)
    }

    const formattedMonth = prettyDate(monthTimestamp)


    const countMessage = `${extensionCount} new extensions ${verb} added this month.`


    const name = `Extensions added in ${formattedMonth}`

    return (
      <Layout location={location}>
        <BreadcrumbBar name={name} />

        <ExtensionCardList>
          <Heading>New extensions added in {formattedMonth.replaceAll(" ", ", ")}</Heading>
          <InfoSortRow>
            <ExtensionCount>{countMessage}</ExtensionCount>
            {isMobile || <Sortings sorterAction={setExtensionComparator} downloadData={downloadData} />}
          </InfoSortRow>
          <FilterableList className="extensions-list">
            <Extensions>
              {extensions.map(extension => {
                return (
                  <CardItem key={extension.id}>
                    <ExtensionCard extension={extension} />
                  </CardItem>
                )
              })}
            </Extensions>{" "}
          </FilterableList>
          {nav}
        </ExtensionCardList>
      </Layout>

    )
  } else {
    return (
      <div className="extensions-list" style={{ display: "flex" }}>
        No new extensions {verb} added this month.
        {nav}
      </div>
    )
  }
}

export default ExtensionsAddedListTemplate

export const pageQuery = graphql`
  query ExtensionByMonthAdded(
    $sinceMonth: String!
  ) {
    allExtension(
    filter: {metadata: {maven: {sinceMonth: {glob: $sinceMonth }}}}
    sort: {fields: metadata___maven___timestamp, order: DESC}
    ) {
    edges {
      node {
      name
      sortableName
      slug
      description
      artifact
      metadata {
        status
        categories
        icon {
          childImageSharp {
            gatsbyImageData(width: 208)
          }
          publicURL
        }
        maven {
          version
          groupId
          artifactId
          timestamp
          sinceMonth
        }
        sourceControl {
          lastUpdated
          projectImage {
            childImageSharp {
              gatsbyImageData(width: 208)
            }
          }
          extensionRootUrl
          ownerImage {
            childImageSharp {
              gatsbyImageData(width: 208)
            }
          }
        }
      }

      isSuperseded
    }
    }
    }
           
    downloadDataDate( id: {regex: "/.*/g"}) {
      date
    }
  }
`
