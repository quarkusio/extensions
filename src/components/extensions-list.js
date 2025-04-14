import * as React from "react"
import { useState } from "react"
import Filters from "./filters/filters"
import ExtensionCard from "./extension-card"
import styled from "styled-components"
import Sortings from "./sortings/sortings"
import { device } from "./util/styles/breakpoints"
import { useMediaQuery } from "react-responsive"
import { CardItem, Extensions, FilterableList, InfoSortRow } from "./extensions-display/list-elements"


const ExtensionCount = styled.h2`
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

export const ExtensionCardList = styled.main`
  margin-left: var(--site-margins);
  margin-right: var(--site-margins);

  display: flex;
  flex-direction: column;

  flex: 1 1 auto;
`

const ExtensionsList = ({ extensions, categories, downloadData }) => {
  const allExtensions = extensions

  const [filteredExtensions, setExtensions] = useState(allExtensions)
  const [extensionComparator, setExtensionComparator] = useState(() => undefined)

  const isMobile = useMediaQuery({ query: device.sm })

  if (allExtensions) {

    // Exclude unlisted and superseded extensions from the count, even though we sometimes show them if there's a direct search for it
    const extensionCount = allExtensions.filter(
      extension => !(extension.metadata.unlisted || extension.isSuperseded)
    ).length

    if (extensionComparator) {
      filteredExtensions.sort(extensionComparator)
    }

    const countMessage =
      extensionCount === filteredExtensions.length
        ? `Showing ${extensionCount} extensions`
        : (filteredExtensions.length < extensionCount) ? `Showing ${filteredExtensions.length} matching of ${extensionCount} extensions` : `Showing ${filteredExtensions.length} extensions (including some unlisted and relocated extensions)`

    return (
      <ExtensionCardList>
        <InfoSortRow>
          <ExtensionCount>{countMessage}</ExtensionCount>
          {isMobile || <Sortings sorterAction={setExtensionComparator} downloadData={downloadData} />}
        </InfoSortRow>
        <FilterableList className="extensions-list">
          <Filters extensions={allExtensions}
                   categories={categories}
                   filterAction={setExtensions}
                   sorterAction={setExtensionComparator}
                   downloadData={downloadData}
          />
          <Extensions>
            {filteredExtensions.map(extension => {
              return (
                <CardItem key={extension.id}>
                  <ExtensionCard extension={extension} />
                </CardItem>
              )
            })}
          </Extensions>{" "}
        </FilterableList>
      </ExtensionCardList>
    )
  } else {
    return (
      <div className="extensions-list" style={{ display: "flex" }}>
        No extensions found.
      </div>
    )
  }
}

export default ExtensionsList
