import * as React from "react"
import DropdownFilter from "./dropdown-filter"

const optionTransformer = string => string

const VersionFilter = ({ extensions, filterer }) => {
  const options = extensions
    ? [
        ...new Set(
          extensions
            .map(extension => extension.metadata.built_with_quarkus_core)
            .flat()
        ),
      ]
    : []

  return (
    <DropdownFilter
      displayLabel="Quarkus Version"
      filterer={filterer}
      options={options}
      optionTransformer={optionTransformer}
    />
  )
}

export default VersionFilter
