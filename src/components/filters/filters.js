import * as React from "react"
import { useEffect, useState } from "react"
import styled from "styled-components"
import Search from "./search"
import StatusFilter from "./status-filter"
import KeywordFilter from "./keyword-filter"
import { useMediaQuery } from "react-responsive"
import CategoryFilter from "./category-filter"
import { device } from "../util/styles/breakpoints"
import Sortings from "../sortings/sortings"
import { faSliders, faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

const FilterBar = styled.aside`
  display: flex;
  flex-direction: column;

  width: 224px;
  padding-right: 40px;
  margin-top: 1.25rem;
  justify-content: flex-start;
  align-items: center;
`

const Done = styled.div``

const MenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding-left: var(--a-modest-space);
  padding-right: var(--a-modest-space);

  // noinspection CssUnknownProperty
  @media ${device.sm} {
    padding: var(--a-vsmall-space) var(--mobile-filter-margins);
  }
`

const MobileFilterMenu = styled.aside`
  display: flex;
  flex-direction: column;
  border: 1px solid var(--filter-outline-color);
`

const FilterToggler = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-content: center;
  align-items: flex-end;
  gap: var(--a-vsmall-space);
`

const filterExtensions = (
  extensions,
  { regex, categoryFilter, keywordFilter, statusFilter, compatibilityFilter }
) => {
  // To handle arrays in both filters and extensions, squash the filter down to a string
  statusFilter = statusFilter?.toString()

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
          statusFilter.includes(extension.metadata.status)))

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

const Filters = ({ extensions, categories, keywords, filterAction, sorterAction, downloadData }) => {
  const [regex, setRegex] = useState(".*")
  const [categoryFilter, setCategoryFilter] = useState([])
  const [keywordFilter, setKeywordFilter] = useState([])
  const [statusFilter, setStatusFilter] = useState([])
  const [compatibilityFilter, setCompatibilityFilter] = useState([])

  const isMobile = useMediaQuery({ query: device.sm })

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

  const [isOpen, setOpen] = React.useState(false)

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const filterElements = <>
    <Search searcher={setRegex} />
    <StatusFilter extensions={extensions} filterer={setStatusFilter} />
    <CategoryFilter categories={categories} filterer={setCategoryFilter} />
    {/* This will be invisible, because we don't pass through keywords, but it will allow filtering via query
      parameters */}
    <KeywordFilter keywords={keywords} filterer={setKeywordFilter} />
  </>

  if (isMobile) {
    if (isOpen) {
      return (
        <MobileFilterMenu className="filters">
          <MenuHeader>
            <div>Filter By</div>
            <Done onClick={handleClose}><FontAwesomeIcon icon={faXmark}
                                                         title="Done" />
            </Done>
          </MenuHeader>
          {filterElements}
          <Sortings sorterAction={sorterAction} downloadData={downloadData}></Sortings>
        </MobileFilterMenu>)
    } else {
      return <FilterToggler onClick={handleOpen}>
        <div>Filter</div>
        <FontAwesomeIcon icon={faSliders}
                         title="sliders" />
        <div hidden={true}>
          {filterElements}
          <Sortings sorterAction={sorterAction} downloadData={downloadData}></Sortings>
        </div>
      </FilterToggler>
    }
  } else {
    return <FilterBar className="filters">
      {filterElements}
    </FilterBar>
  }


}

export default Filters
