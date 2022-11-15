import * as React from "react"
import styled from "styled-components"
import Select from "react-select"
import Title from "./title"
import styles from "../../style"

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

const borderRadius = styles["border-radius"]

const colourStyles = {
  control: styles => ({
    ...styles,
    borderRadius: borderRadius,
    color: grey,
    borderColor: grey,
    width: "220px",
  }),
  option: (styles, { isDisabled }) => {
    return {
      ...styles,
      cursor: isDisabled ? "not-allowed" : "default",
      borderRadius: borderRadius,
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

const DropdownFilter = ({
  options,
  filterer,
  displayLabel,
  optionTransformer,
}) => {
  const label = displayLabel
    ? displayLabel.toLowerCase().replace(" ", "-")
    : "unknown"

  const processedOptions = options
    ? options.map(option => {
        return { value: option, label: optionTransformer(option) }
      })
    : []

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
