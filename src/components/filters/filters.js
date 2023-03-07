import * as React from "react"
import { useEffect, useState } from "react"
import styled from "styled-components"
import CategoryFilter from "./category-filter"
import Search from "./search"
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
  return (
    extensions
      // Exclude unlisted extensions, unless they happen to match a non-trivial search filter
      // We don't need to check if the searches matches, because we do that below
      .filter(extension => !extension.metadata.unlisted || regex.length > 2)
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
          (extension.platforms &&
            extension.platforms?.find(platform =>
              platformFilter.includes(platform)
            ))
      )
      .filter(
        extension =>
          versionFilter.length === 0 ||
          (extension.metadata.builtWithQuarkusCore &&
            versionFilter.includes(extension.metadata.builtWithQuarkusCore))
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

const Filters = ({ extensions, categories, filterAction }) => {
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

  const platforms = extensions.map(extension => extension.platforms).flat()

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
      <PlatformFilter options={platforms} filterer={setPlatformFilter} />
    </FilterBar>
  )
}

export default Filters
