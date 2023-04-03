import * as React from "react"
import DropdownFilter from "./dropdown-filter"
import { compareStatus } from "../util/compare-status"

const optionTransformer = string => string

const compare = (a, b) => {
  return compareStatus(a, b)
}

const StatusFilter = ({ extensions, filterer }) => {
  const options = extensions
    ? extensions
        .map(extension => extension.metadata.status)
        .filter(el => el != null)
        .flat()
    : []

  return (
    <DropdownFilter
      displayLabel="Status"
      filterer={filterer}
      options={options}
      optionTransformer={optionTransformer}
      compareFunction={compare}
    />
  )
}

export default StatusFilter
