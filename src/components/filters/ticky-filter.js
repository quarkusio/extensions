import React, { useEffect } from "react"
import styled from "styled-components"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

import Title from "./title"
import { getQueryParams, useQueryParamString } from "react-use-query-param-string"

const Element = styled.div`
  padding-top: 36px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
`

const Entry = styled.li`
  font-size: var(--font-size-16);
  color: var(--main-text-color);
  display: flex;
  padding: 0;
  gap: 8px;
`

const Entries = styled.ul`
  list-style: none;
  padding: 0;
  margin: 10px;
  line-height: 23px;
`

const TickyBox = styled(props => <FontAwesomeIcon {...props} />)`
  font-size: 16px;
  color: var(--main-text-color);
`

const separator = ","
const noop = a => a

const toggleEntry = (
  entry,
  tickedEntries,
  setTickedEntries,
  filterer
) => {
  if (tickedEntries.includes(entry)) {
    tickedEntries = tickedEntries.filter(item => item !== entry)
  } else {
    tickedEntries = [...tickedEntries, entry] // It's important to make a new array or nothing will be re-rendered
  }
  if (tickedEntries.length > 0) {
    setTickedEntries(tickedEntries?.join(separator))
  } else {
    // Clear this filter from the URL bar if there's nothing in it
    setTickedEntries(undefined)
  }
  filterer && filterer(tickedEntries)
}

const TickyFilter = ({ entries, filterer, prettify, label, queryKey }) => {
  const key = queryKey || label.toLowerCase().replace(" ", "-")

  const [stringedTickedEntries, setTickedEntries, initialized] = useQueryParamString(key, undefined, true)
  const realStringedTickedEntries = initialized ? stringedTickedEntries : getQueryParams() ? getQueryParams()[key] : undefined

  const tickedEntries = stringedTickedEntries ? stringedTickedEntries.split(separator) : []

  prettify = prettify || noop

  const onClick = entry => () =>
    toggleEntry(
      entry,
      tickedEntries,
      setTickedEntries,
      filterer
    )

  useEffect(() => {  // Make sure that even if the url is pasted in a browser, the list updates with the right value
    if (realStringedTickedEntries && realStringedTickedEntries.length > 0) {
      filterer(realStringedTickedEntries.split(separator))
    }
  }, [realStringedTickedEntries, filterer], filterer)

  return (
    entries && <Element>
      <Title>{label}</Title>
      <Entries>
        {entries &&
          entries.map(entry => (
            <Entry
              key={entry}
              onClick={onClick(entry)
              }
            >
              <div>
                {tickedEntries.includes(entry) ? (
                  <TickyBox icon="square-check" title="ticked" />
                ) : (
                  <TickyBox icon={["far", "square"]} title="unticked" />
                )}
              </div>
              <div>{prettify(entry)}</div>
            </Entry>
          ))}
      </Entries>
    </Element>
  )
}

export default TickyFilter
