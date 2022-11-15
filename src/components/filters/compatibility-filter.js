import * as React from "react"
import DropdownFilter from "./dropdown-filter"
import prettyCategory from "../util/pretty-category"

const CompatibilityFilter = ({ extensions, filterer }) => {
  const options = extensions
    ? [
        ...new Set(
          extensions
            .map(extension => extension.metadata.quarkus_core_compatibility)
            .flat()
        ),
      ]
    : []

  return (
    <DropdownFilter
      displayLabel="Compatibility"
      filterer={filterer}
      options={options}
      optionTransformer={prettyCategory}
    />
  )
}

export default CompatibilityFilter
