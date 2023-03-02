import * as React from "react"
import DropdownFilter from "./dropdown-filter"
import compareVersion from "compare-version"

const optionTransformer = string => string

const compare = (a, b) => {
  return -1 * compareVersion(a, b)
}

const VersionFilter = ({ extensions, filterer }) => {
  const options = extensions
    ? extensions
        .map(extension => extension.metadata.builtWithQuarkusCore)
        .filter(el => el != null)
        .flat()
    : []

  return (
    <DropdownFilter
      displayLabel="Built With"
      filterer={filterer}
      options={options}
      optionTransformer={optionTransformer}
      compareFunction={compare}
    />
  )
}

export default VersionFilter
