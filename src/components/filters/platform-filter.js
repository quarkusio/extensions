import * as React from "react"
import styled from "styled-components"
import Select from "react-select"
import Title from "./title"
import prettyCategory from "../util/pretty-category"

const Element = styled.form`
  padding-top: 36px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 16px;
`
const IndicatorSeparator = styled.span`
  align-self: stretch;
  background-color: var(--grey-2);
  width: 1px;
  box-sizing: border-box;
`

const PlatformFilter = ({ options }) => {
  const label = "platform"
  const processedOptions = options
    ? options.map(option => {
        return { value: option, label: prettyCategory(option) }
      })
    : []

  // Grab CSS variables in javascript
  const grey = getComputedStyle(document.documentElement).getPropertyValue(
    "--grey-2"
  )

  const borderRadius = getComputedStyle(
    document.documentElement
  ).getPropertyValue("--border-radius")

  const colourStyles = {
    control: styles => ({
      ...styles,
      borderRadius: borderRadius,
      color: grey,
      borderColor: grey,
    }),
    option: (styles, { data, isDisabled, isFocused, isSelected }) => {
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
  }

  return (
    <Element data-testid="platform-form">
      <Title htmlFor={label}>Platform</Title>
      <Select
        placeholder="All"
        options={processedOptions}
        name={label}
        inputId={label}
        styles={colourStyles}
        components={{ IndicatorSeparator: IndicatorSeparator }}
      />
    </Element>
  )
}

export default PlatformFilter
