import * as React from "react"
import { useEffect, useState } from "react"
import styled from "styled-components"
import CategoryFilter from "./category-filter"
import Search from "./search"
import StatusFilter from "./status-filter"
import KeywordFilter from "./keyword-filter"

const FilterBar = styled.aside`
  width: 224px;
  margin-top: 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
`

const filterExtensions = (
  extensions,
  { regex, categoryFilter, keywordFilter, statusFilter, compatibilityFilter }
) => {
  const regexObj = new RegExp(regex, "i")

  return (
    extensions
      // Exclude unlisted and superseded extensions, unless they happen to match a non-trivial search filter
      // We don't need to check if the searches matches, because we do that below
      .filter(extension => (!extension.metadata.unlisted && !extension.isSuperseded) || regex.length > 2)
      .filter(
        extension =>
          regexObj.test(extension.name) ||
          regexObj.test(extension.description) ||
          regexObj.test(extension.artifact?.replace("::jar", ""))
      )
      .filter(
        extension =>
          categoryFilter.length === 0 ||
          extension.metadata.categories?.find(category =>
            categoryFilter.includes(category.toLowerCase())
          )
      )
      .filter(
        extension =>
          keywordFilter.length === 0 ||
          extension.metadata.keywords?.find(keyword =>
            keywordFilter.includes(keyword.toLowerCase())
          )
      ).filter(
      extension =>
        statusFilter.length === 0 ||
        (extension.metadata.status &&
          statusFilter.includes(extension.metadata.status))
    )
      .filter(
        extension =>
          compatibilityFilter.length === 0 ||
          (extension.metadata.quarkus_core_compatibility &&
            compatibilityFilter.includes(
              extension.metadata.quarkus_core_compatibility
            ))
      )
  )
}

const Filters = ({ extensions, categories, keywords, filterAction }) => {
  const [regex, setRegex] = useState(".*")
  const [categoryFilter, setCategoryFilter] = useState([])
  const [keywordFilter, setKeywordFilter] = useState([])
  const [statusFilter, setStatusFilter] = useState([])
  const [compatibilityFilter, setCompatibilityFilter] = useState([])

  const filters = {
    regex,
    categoryFilter,
    keywordFilter,
    statusFilter,
    compatibilityFilter,
  }

  const filteredExtensions = filterExtensions(extensions, filters)

  // Infinite loop avoidance! We only call the filteraction if any of these change
  // It would be nice to make the filters a function, but that might make the comparison on these harder
  const dependencyList = [
    regex,
    categoryFilter,
    keywordFilter,
    statusFilter,
    compatibilityFilter,
  ]

  useEffect(() => {
    filterAction(filteredExtensions)
  }, dependencyList)

  return (
    <FilterBar className="filters">
      <Search searcher={setRegex} />
      <StatusFilter extensions={extensions} filterer={setStatusFilter} />
      <CategoryFilter categories={categories} filterer={setCategoryFilter} />
      {/* This will be invisible, because we don't pass through keywords, but it will allow filtering via query
      parameters */}
      <KeywordFilter keywords={keywords} filterer={setKeywordFilter} />

    </FilterBar>
  )
}

export default Filters
