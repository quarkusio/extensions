import * as React from "react"
import { useState } from "react"
import Filters from "./filters/filters"
import ExtensionCard from "./extension-card"
import styled from "styled-components"

const FilterableList = styled.div`
  margin-left: 208px;
  margin-right: 208px;
  margin-top: 85px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`

const Extensions = styled.ol`
  list-style: none;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
`

const filterExtensions = (extensions, { categoryFilter, regex }) => {
  return extensions
    .filter(extension =>
      extension.name.toLowerCase().match(regex.toLowerCase())
    )
    .filter(
      extension =>
        categoryFilter.length === 0 ||
        (extension.metadata.categories &&
          extension.metadata.categories.find(category =>
            categoryFilter.includes(category.toLowerCase())
          ))
    )
}

const ExtensionsList = ({ extensions }) => {
  const [regex, setRegex] = useState(".*")
  const [categoryFilter, setCategoryFilter] = useState([])

  // TODO why is this guard necessary?
  if (extensions) {
    const filterActions = { searcher: setRegex, filterer: setCategoryFilter }

    const categories = [
      ...new Set(
        extensions.map(extension => extension.metadata.categories).flat()
      ),
    ]

    const platforms = [
      ...new Set(extensions.map(extension => extension.origins).flat()),
    ]

    const filters = { regex, categoryFilter }
    const filteredExtensions = filterExtensions(extensions, filters)

    return (
      <FilterableList className="extensions-list">
        <Filters
          categories={categories}
          platforms={platforms}
          filterActions={filterActions}
        />
        <Extensions>
          {filteredExtensions.map(extension => {
            return (
              <li key={extension.name}>
                <ExtensionCard extension={extension} />
              </li>
            )
          })}
        </Extensions>
      </FilterableList>
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
