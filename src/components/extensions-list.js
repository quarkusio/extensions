import * as React from "react"
import { useState } from "react"
import Filters from "./filters/filters"
import ExtensionCard from "./extension-card"
import styled from "styled-components"
import Sortings from "./sortings/sortings"

const FilterableList = styled.div`
  margin-left: var(--site-margins);
  margin-right: var(--site-margins);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`

const Extensions = styled.ol`
  list-style: none;
  display: grid;
  gap: 30px;
  width: 100%;
  grid-template-columns: repeat(auto-fill, minmax(260px, auto));
  grid-template-rows: repeat(auto-fill, 1fr);
`

const CardItem = styled.li`
  height: 100%;
  width: 100%;
  display: flex;
  max-height: 34rem;
`

const InfoSortRow = styled.div`
  margin-top: 85px;
  padding-left: var(--site-margins);
  padding-right: var(--site-margins);
  display: flex;
  column-gap: var(--a-modest-space);
  justify-content: space-between;
`

const ExtensionCount = styled.h2`
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  font-weight: 400;
  font-style: italic;
`

const ExtensionsList = ({ extensions, categories, downloadData }) => {
  // Do some pre-filtering for content we will never want, like superseded extensions
  const allExtensions = extensions.filter(extension => !extension.isSuperseded)

  const [filteredExtensions, setExtensions] = useState(allExtensions)
  const [extensionComparator, setExtensionComparator] = useState(() => undefined)

  if (allExtensions) {
    // Exclude unlisted extensions from the count, even though we sometimes show them if there's a direct search for it
    const extensionCount = allExtensions.filter(
      extension => !extension.metadata.unlisted
    ).length

    if (extensionComparator) {
      filteredExtensions.sort(extensionComparator)
    }

    const countMessage =
      extensionCount === filteredExtensions.length
        ? `Showing ${extensionCount} extensions`
        : `Showing ${filteredExtensions.length} matching of ${extensionCount} extensions`

    return (
      <div>
        <InfoSortRow><ExtensionCount>{countMessage}</ExtensionCount>
          <Sortings sorterAction={setExtensionComparator} downloadData={downloadData}></Sortings>
        </InfoSortRow>
        <FilterableList className="extensions-list">
          <Filters
            extensions={allExtensions}
            categories={categories}
            filterAction={setExtensions}
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
      </div>
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
