import * as React from "react"
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

const Filters = ({ filterActions: { searcher } }) => {
  return (
    <FilterBar className="filters">
      <Search searcher={searcher} />
      <VersionFilter />
      <CategoryFilter />
      <CompatibilityFilter />
      <PlatformFilter />
      <RatingFilter />
    </FilterBar>
  )
}

export default Filters
