import * as React from "react"
import styled from "styled-components"
import Select from "react-select"
import { timestampExtensionComparator } from "./timestamp-extension-comparator"
import { alphabeticalExtensionComparator } from "./alphabetical-extension-comparator"
import { downloadsExtensionComparator } from "./downloads-extension-comparator"
import { useQueryParamString } from "react-use-query-param-string"

const format = new Intl.DateTimeFormat("default", {
  year: "numeric",
  month: "long"
})

const Title = styled.label`
  font-size: var(--font-size-16);
  letter-spacing: 0;
  color: var(--sec-text-color);
  width: 100px;
  text-align: right;
`

const SortBar = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  gap: var(--a-small-space);
  flex-grow: 2;
`

const Element = styled.form`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 16px;
`

const DownloadDataData = styled.h2`
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  width: 100%;
  font-size: 1rem;
  font-weight: 400;
  font-style: italic;
`

const classNames = {
  menu: state => state.isFocused ? "select-menu__focused" : "select-menu",
  singleValue: () => "select-single-value",
  control: () => "select-control-sort",
  option: state => state.isSelected ? "select-option__selected" : state.isDisabled ? "select-option__disabled" : state.isFocused ? "select-option__focused" : "select-option__default",
  dropdownIndicator: () => "select-dropdown-indicator",
  indicatorSeparator: () => "select-indicator-separator"
}

const key = "sort"
const downloads = "downloads"
const time = "time"
const sortings = [
  { label: "Most recently released", value: time, comparator: timestampExtensionComparator },
  { label: "Alphabetical", value: "alpha", comparator: alphabeticalExtensionComparator },
  { label: "Downloads", value: downloads, comparator: downloadsExtensionComparator }]

const Sortings = ({ sorterAction, downloadData }) => {
  const [sort, setSort] = useQueryParamString(key, time, true)

  const applySort = (entry) => {
    // We need to wrap our comparator functions in functions or they get called, which goes very badly
    sorterAction && sorterAction(() => entry.comparator)
  }


  const filteredSortings = downloadData?.date ? sortings : sortings.filter(e => e.value !== downloads)

  const selected = filteredSortings.find(entry => entry.value === sort)

  if (selected) {
    applySort(selected)
  }

  const formattedDate = downloadData?.date ? format.format(new Date(Number(downloadData.date))) : ""

  return (
    <SortBar className="sortings">
      {sort === downloads &&
        <DownloadDataData>Based on Maven Central downloads in {formattedDate}. Download data is only available for
          extensions in Quarkus,
          Quarkiverse, and Camel orgs.
        </DownloadDataData>}
      <Title htmlFor="sort">Sort by</Title>
      <Element data-testid="sort-form">
        <Select
          placeholder="Default"
          value={selected}
          options={filteredSortings}
          onChange={entry => {
            if (entry.value !== sort) {
              setSort(entry.value)
              applySort(entry)
            }
          }}

          name="sort"
          inputId="sort"
          classNames={classNames}
        />
      </Element>
    </SortBar>
  )
}

export default Sortings

