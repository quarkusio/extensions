import * as React from "react"
import { useState } from "react"

import { useMediaQuery } from "react-responsive"
import { device } from "../components/util/styles/breakpoints"
import ExtensionCard from "../components/extension-card"
import { graphql, Link } from "gatsby"
import BreadcrumbBar from "../components/extensions-display/breadcrumb-bar"
import Layout from "../components/layout"
import Sortings from "../components/sortings/sortings"
import { slugForExtensionsAddedMonth } from "../components/util/extension-slugger"
import { dateFormatOptions } from "../components/util/date-utils"
import { ExtensionCardList } from "../components/extensions-list"
import {
  CardItem,
  ExtensionCount,
  ExtensionListHeading,
  Extensions,
  FilterableList,
  InfoSortRow
} from "../components/extensions-display/list-elements"


const prettyDate = (timestamp) => new Date(+timestamp).toLocaleDateString("en-US", dateFormatOptions)


const ExtensionsAddedListTemplate = (
  {
    data: {
      allExtension, downloadDataDate,
    },
    pageContext: { nextMonthTimestamp, previousMonthTimestamp, sinceMonth },
    location,
  }) => {
  const monthTimestamp = sinceMonth
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

  const now = new Date()
  const date = new Date(+monthTimestamp)
  const verb = now.getUTCMonth() === date.getUTCMonth() && now.getUTCFullYear() === date.getUTCFullYear() ? "have been" : "were"
  const formattedMonth = prettyDate(monthTimestamp)
  const name = `Extensions added in ${formattedMonth}`

  if (extensions && extensions.length > 0) {

    // Exclude unlisted and superseded extensions from the count, even though we sometimes show them if there's a direct search for it
    const extensionCount = extensions.filter(
      extension => !(extension.metadata.unlisted || extension.isSuperseded)
    ).length

    if (extensionComparator) {
      extensions.sort(extensionComparator)
    }

    const countMessage = `${extensionCount} new extensions ${verb} added this month.`

    return (
      <Layout location={location}>
        <BreadcrumbBar name={name} />

        <ExtensionCardList>
          <ExtensionListHeading>New extensions added in {formattedMonth.replaceAll(" ", ", ")}</ExtensionListHeading>
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
      <Layout location={location}>
        <BreadcrumbBar name={name} />
        <ExtensionCardList>
          <h4>
            No new extensions {verb} added in {formattedMonth}.
          </h4>
          {nav}
        </ExtensionCardList>
      </Layout>
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
