import * as React from "react"
import DropdownFilter from "./dropdown-filter"
import { prettyPlatformName } from "../util/pretty-platform"

const PlatformFilter = ({ options, filterer }) => {
  return (
    <DropdownFilter
      displayLabel="Origin"
      filterer={filterer}
      options={options}
      optionTransformer={prettyPlatformName}
    />
  )
}

export default PlatformFilter
