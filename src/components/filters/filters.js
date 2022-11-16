import * as React from "react"
import { useEffect, useState } from "react"
import styled from "styled-components"
import CategoryFilter from "./category-filter"
import Search from "./search"
import CompatibilityFilter from "./compatibility-filter"
import PlatformFilter from "./platform-filter"
import VersionFilter from "./version-filter"

const FilterBar = styled.aside`
  width: 224px;
  padding-top: 31px; // TODO can we do better than this rather specific hardcoding to align with the cards?
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
`

const filterExtensions = (
  extensions,
  { regex, categoryFilter, platformFilter, versionFilter, compatibilityFilter }
) => {
  return extensions
    .filter(
      extension =>
        extension.name.toLowerCase().match(regex.toLowerCase()) ||
        extension.description?.toLowerCase().match(regex.toLowerCase())
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
        platformFilter.length === 0 ||
        (extension.origins &&
          extension.origins?.find(origin => platformFilter.includes(origin)))
    )
    .filter(
      extension =>
        versionFilter.length === 0 ||
        (extension.metadata.built_with_quarkus_core &&
          versionFilter.includes(extension.metadata.built_with_quarkus_core))
    )
    .filter(
      extension =>
        compatibilityFilter.length === 0 ||
        (extension.metadata.quarkus_core_compatibility &&
          compatibilityFilter.includes(
            extension.metadata.quarkus_core_compatibility
          ))
    )
}

const Filters = ({ extensions, filterAction }) => {
  const [regex, setRegex] = useState(".*")
  const [categoryFilter, setCategoryFilter] = useState([])
  const [platformFilter, setPlatformFilter] = useState([])
  const [versionFilter, setVersionFilter] = useState([])
  const [compatibilityFilter, setCompatibilityFilter] = useState([])

  const filters = {
    regex,
    categoryFilter,
    platformFilter,
    versionFilter,
    compatibilityFilter,
  }

  const categories = [
    ...new Set(
      extensions.map(extension => extension.metadata.categories).flat()
    ),
  ]

  const platforms = [
    ...new Set(extensions.map(extension => extension.origins).flat()),
  ]

  const filteredExtensions = filterExtensions(extensions, filters)

  // Infinite loop avoidance! We only call the filteraction if any of these change
  // It would be nice to make the filters a function, but that might make the comparison on these harder
  const dependencyList = [
    regex,
    categoryFilter,
    platformFilter,
    versionFilter,
    compatibilityFilter,
  ]

  useEffect(() => {
    filterAction(filteredExtensions)
  }, dependencyList)

  return (
    <FilterBar className="filters">
      <Search searcher={setRegex} />
      <VersionFilter extensions={extensions} filterer={setVersionFilter} />
      <CategoryFilter categories={categories} filterer={setCategoryFilter} />
      <CompatibilityFilter
        extensions={extensions}
        filterer={setCompatibilityFilter}
      />
      <PlatformFilter options={platforms} filterer={setPlatformFilter} />
    </FilterBar>
  )
}

export default Filters
