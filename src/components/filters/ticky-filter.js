import React, { useEffect } from "react"
import styled from "styled-components"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

import Title from "./title"
import { getQueryParams, useQueryParamString } from "react-use-query-param-string"
import { useMediaQuery } from "react-responsive"
import { Element, Entries, Entry, FilterSubmenu } from "./filter-submenu"
import { device } from "../util/styles/breakpoints"

const DesktopWrapper = styled.div``


const TickyBox = styled(props => <FontAwesomeIcon {...props} />)`
  font-size: 16px;
  color: var(--main-text-color);
`

const PlatformEntry = styled(Entry)`
`

const NonPlatformEntry = styled(Entry)`
  opacity: 0.7;
`

const separator = ","
const noop = a => a

const toggleEntry = (
  entryName,
  tickedEntries,
  setTickedEntries,
  filterer
) => {
  if (tickedEntries.includes(entryName)) {
    tickedEntries = tickedEntries.filter(item => item !== entryName)
  } else {
    tickedEntries = [...tickedEntries, entryName] // It's important to make a new array or nothing will be re-rendered
  }
  if (tickedEntries.length > 0) {
    setTickedEntries(tickedEntries?.join(separator))
  } else {
    // Clear this filter from the URL bar if there's nothing in it
    setTickedEntries(undefined)
  }
  filterer && filterer(tickedEntries)
}

const normalize = x => typeof x === "string" ? x.toLowerCase() : x

// Get the name for display (used with prettify)
const getName = x => {
  if (typeof x === "string") return x
  // Category objects have categoryId (for filtering) and name (for display)
  return x.categoryId || x.name
}

// Get the display name (already prettified for category objects)
const getDisplayName = x => {
  if (typeof x === "string") return x
  return x.name || x.categoryId
}

const TickyFilter = ({ entries, filterer, prettify, label, queryKey }) => {
  prettify = prettify || noop

  // Eliminate duplicates, in a case-insensitive way
  entries = entries.reduce((result, element) => {

    const normalizedElement = normalize(getName(element))
    if (result.every(otherElement => normalize(getName(otherElement)) !== normalizedElement))
      result.push(element)

    return result
  }, [])

  const key = queryKey || label.toLowerCase().replace(" ", "-")

  const [stringedTickedEntries, setTickedEntries, initialized] = useQueryParamString(key, undefined, true)
  const realStringedTickedEntries = initialized ? stringedTickedEntries : getQueryParams() ? getQueryParams()[key] : undefined

  const tickedEntries = stringedTickedEntries ? stringedTickedEntries.split(separator) : []


  const onClick = entry => () =>
    toggleEntry(
      getName(entry),
      tickedEntries,
      setTickedEntries,
      filterer
    )

  useEffect(() => {  // Make sure that even if the url is pasted in a browser, the list updates with the right value
    if (realStringedTickedEntries && realStringedTickedEntries.length > 0) {
      filterer(realStringedTickedEntries.split(separator))
    }
  }, [realStringedTickedEntries, filterer], filterer)


  const isMobile = useMediaQuery({ query: device.sm })


  const filter = (
    entries && <Element>
      <Entries>
        {entries &&
          entries.map(entry => {
            const entryName = getName(entry)
            const isPlatform = typeof entry === "object" && entry.isPlatform
            const EntryComponent = isPlatform ? PlatformEntry : NonPlatformEntry
            // For category objects, use the pre-prettified name; for strings, use prettify
            const displayName = typeof entry === "object" && entry.name ? getDisplayName(entry) : prettify(entryName)
            return (
              <EntryComponent
                key={entryName}
                onClick={onClick(entry)}
              >
                <div>
                  {tickedEntries.includes(entryName) ? (
                    <TickyBox icon="square-check" title="ticked" />
                  ) : (
                    <TickyBox icon={["far", "square"]} title="unticked" />
                  )}
                </div>
                <label>{displayName}</label>
              </EntryComponent>
            )
          })}
      </Entries>
    </Element>
  )

  if (isMobile) {
    return (entries &&
      <Element name={label}>
        <FilterSubmenu title={label}>
          {filter}
        </FilterSubmenu>
      </Element>)
  } else {
    return entries && <DesktopWrapper>
      <Title>{label}</Title>
      {filter}
    </DesktopWrapper>
  }

}

export default TickyFilter
