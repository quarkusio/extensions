import * as React from "react"
import styled from "styled-components"
import Select from "react-select"
import { styles } from "../util/styles/style"
import { timestampExtensionComparator } from "./timestamp-extension-comparator"
import { alphabeticalExtensionComparator } from "./alphabetical-extension-comparator"

const Title = styled.label`
  font-size: var(--font-size-16);
  letter-spacing: 0;
  color: var(--grey-2);
  width: 100px;
  text-align: right;
`

const SortBar = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  gap: var(--a-small-space);
`

const Element = styled.form`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 16px;
`

// Grab CSS variables in javascript
const grey = styles["grey-2"]

const colourStyles = {
  control: styles => ({
    ...styles,
    borderRadius: 0,
    color: grey,
    borderColor: grey,
    width: "280px",
  }),
  option: (styles, { isDisabled }) => {
    return {
      ...styles,
      cursor: isDisabled ? "not-allowed" : "default",
      borderRadius: 0,
    }
  },
  dropdownIndicator: styles => ({
    ...styles,
    color: grey, // Custom colour
  }),
  indicatorSeparator: styles => ({
    ...styles,
    margin: 0,
    backgroundColor: grey,
  }),
}

const sortings = [
  { label: "Most recently released", value: "time", comparator: timestampExtensionComparator },
  { label: "Alphabetical", value: "alpha", comparator: alphabeticalExtensionComparator }]

const Sortings = ({ sorterAction }) => {

  const setSortByDescription = (entry) => {
    // We need to wrap our comparator functions in functions or they get called, which goes very badly
    sorterAction && sorterAction(() => entry.comparator)
  }

  return (
    <SortBar className="sortings">
      <Title htmlFor="sort">Sort by</Title>
      <Element data-testid="sort-form">
        <Select
          placeholder="Default"
          options={sortings}
          onChange={label => setSortByDescription(label)}
          name="sort"
          inputId="sort"
          styles={colourStyles}
        />
      </Element>
    </SortBar>
  )
}

export default Sortings

