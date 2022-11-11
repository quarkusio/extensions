import * as React from "react"
import { useEffect, useState } from "react"
import styled from "styled-components"
import CategoryFilter from "./category-filter"
import Search from "./search"
import CompatibilityFilter from "./compatibility-filter"
import RatingFilter from "./rating-filter"
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
  { regex, categoryFilter, platformFilter }
) => {
  return extensions
    .filter(extension =>
      extension.name.toLowerCase().match(regex.toLowerCase())
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
}

const Filters = ({ extensions, filterAction }) => {
  const [regex, setRegex] = useState(".*")
  const [categoryFilter, setCategoryFilter] = useState([])
  const [platformFilter, setPlatformFilter] = useState([])

  const filters = { regex, categoryFilter, platformFilter }

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
  const dependencyList = [regex, categoryFilter, platformFilter]

  useEffect(() => {
    filterAction(filteredExtensions)
  }, dependencyList)

  return (
    <FilterBar className="filters">
      <Search searcher={setRegex} />
      <VersionFilter />
      <CategoryFilter categories={categories} filterer={setCategoryFilter} />
      <CompatibilityFilter />
      <PlatformFilter options={platforms} filterer={setPlatformFilter} />
      <RatingFilter />
    </FilterBar>
  )
}

export default Filters
