import * as React from "react"
import styled from "styled-components"
import Select from "react-select"
import Title from "./title"
import prettyPlatform from "../util/pretty-platform"

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

const PlatformFilter = ({ options, filterer }) => {
  const label = "platform"
  const processedOptions = options
    ? options.map(option => {
        return { value: option, label: prettyPlatform(option) }
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

  return (
    <Element data-testid="platform-form">
      <Title htmlFor={label}>Platform</Title>
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

export default PlatformFilter
