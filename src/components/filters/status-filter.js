import * as React from "react"
import DropdownFilter from "./dropdown-filter"
import { compareStatus } from "../util/compare-status"
import { useMediaQuery } from "react-responsive"
import TickyFilter from "./ticky-filter"
import { device } from "../util/styles/breakpoints"

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

  const isMobile = useMediaQuery({ query: device.sm })

  const displayLabel = "Status"

  if (isMobile) {
    return (
      <TickyFilter
        label={displayLabel}
        filterer={filterer}
        entries={options}
        prettifier={optionTransformer}
      />)
  } else {

    return (<>
      <DropdownFilter
        displayLabel={displayLabel}
        filterer={filterer}
        options={options}
        optionTransformer={optionTransformer}
        compareFunction={compare}
      />
    </>)
  }


}

export default StatusFilter
