import * as React from "react"
import styled from "styled-components"
import Select from "react-select"
import Title from "./title"
import { styles } from "../util/styles/style"

const Element = styled.form`
  padding-top: 36px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 16px;
`

const onChange = (value, { action }, filterer) => {
  if (action === "select-option" && filterer) filterer(value.value)
}

// Grab CSS variables in javascript
const grey = styles["grey-2"]

const colourStyles = {
  control: styles => ({
    ...styles,
    borderRadius: 0,
    color: grey,
    borderColor: grey,
    width: "220px",
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

// We may get things that aren't strings, so we can't just use compareTo
const defaultCompare = (a, b) => {
  if (a < b) {
    return -1
  }
  if (a > b) {
    return 1
  }

  return 0
}

const DropdownFilter = ({
                          options,
                          filterer,
                          displayLabel,
                          optionTransformer,
                          compareFunction,
                        }) => {
  const label = displayLabel
    ? displayLabel.toLowerCase().replace(" ", "-")
    : "unknown"

  const deduplicatedOptions = options ? [...new Set(options)] : []

  const processedOptions = deduplicatedOptions.map(option => {
    return { value: option, label: optionTransformer(option) }
  })

  // We need to sort by the label, so sort last
  const compare = compareFunction ? compareFunction : defaultCompare
  processedOptions.sort((a, b) => compare(a.label, b.label))

  // Now add 'All' to the beginning
  // A filter string of zero length is interpreted as 'everything'
  processedOptions.unshift({ value: "", label: "All" })

  return (
    <Element data-testid={label + "-form"}>
      <Title htmlFor={label}>{displayLabel}</Title>
      <Select
        placeholder="All"
        options={processedOptions}
        onChange={(a, b) => onChange(a, b, filterer)}
        name={label}
        inputId={label}
        styles={colourStyles}
      />
    </Element>
  )
}

export default DropdownFilter
