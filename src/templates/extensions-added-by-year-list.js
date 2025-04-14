import * as React from "react"
import { useState } from "react"

import { useMediaQuery } from "react-responsive"
import { device } from "../components/util/styles/breakpoints"
import ExtensionCard from "../components/extension-card"
import { graphql, Link } from "gatsby"
import BreadcrumbBar from "../components/extensions-display/breadcrumb-bar"
import Layout from "../components/layout"
import Sortings from "../components/sortings/sortings"
import { slugForExtensionsAddedYear } from "../components/util/extension-slugger"
import { ExtensionCardList } from "../components/extensions-list"
import {
  CardItem,
  ExtensionCount,
  ExtensionListHeading,
  Extensions,
  FilterableList,
  InfoSortRow
} from "../components/extensions-display/list-elements"

const prettyDate = (timestamp) => new Date(+timestamp).getFullYear()


const ExtensionsAddedByYearListTemplate = (
  {
    data: {
      allExtension, downloadDataDate,
    },
    pageContext: { nextYearTimestamp, previousYearTimestamp },
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
        {previousYearTimestamp && (
          <Link to={"/" + slugForExtensionsAddedYear(previousYearTimestamp)} rel="previous">
            ← {prettyDate(previousYearTimestamp)}
          </Link>
        )}
      </li>
      <li>
        {nextYearTimestamp && (
          <Link to={"/" + slugForExtensionsAddedYear(nextYearTimestamp)} rel="next">
            {prettyDate(nextYearTimestamp)} →
          </Link>
        )}
      </li>
    </ul>
  </nav>)

  const yearTimestamp = extensions[0].metadata.maven.sinceYear
  const now = new Date()
  const date = new Date(+yearTimestamp)
  const verb = now.getFullYear() === date.getFullYear() ? "have been" : "were"

  if (extensions && extensions.length > 0) {

    // Exclude unlisted and superseded extensions from the count, even though we sometimes show them if there's a direct search for it
    const extensionCount = extensions.filter(
      extension => !(extension.metadata.unlisted || extension.isSuperseded)
    ).length

    if (extensionComparator) {
      extensions.sort(extensionComparator)
    }

    const formattedYear = prettyDate(yearTimestamp)


    const countMessage = `${extensionCount} new extensions ${verb} added this year.`

    const name = `Extensions added in ${formattedYear}`

    return (
      <Layout location={location}>
        <BreadcrumbBar name={name} />

        <ExtensionCardList>
          <ExtensionListHeading>New extensions added in {formattedYear}</ExtensionListHeading>
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
        No new extensions {verb} added this year.
        {nav}
      </div>
    )
  }
}

export default ExtensionsAddedByYearListTemplate

export const pageQuery = graphql`
  query ExtensionByYearAdded(
    $sinceYear: String!
  ) {
    allExtension(
    filter: {metadata: {maven: {sinceYear: {glob: $sinceYear }}}}
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
          sinceYear
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
