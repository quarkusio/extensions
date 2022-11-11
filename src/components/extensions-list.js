import * as React from "react"
import { useState } from "react"
import Filters from "./filters/filters"
import ExtensionCard from "./extension-card"
import styled from "styled-components"

const FilterableList = styled.div`
  margin-left: 208px;
  margin-right: 208px;
  margin-top: 85px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`

const Extensions = styled.ol`
  list-style: none;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
`

const ExtensionsList = ({ extensions }) => {
  const allExtensions = extensions
  const [filteredExtensions, setExtensions] = useState(allExtensions)

  // TODO why is this guard necessary?
  if (allExtensions) {
    return (
      <FilterableList className="extensions-list">
        <Filters extensions={allExtensions} filterAction={setExtensions} />
        <Extensions>
          {filteredExtensions.map(extension => {
            return (
              <li key={extension.name}>
                <ExtensionCard extension={extension} />
              </li>
            )
          })}
        </Extensions>
      </FilterableList>
    )
  } else {
    return (
      <div className="extensions-list" style={{ display: "flex" }}>
        No extensions found.
      </div>
    )
  }
}

export default ExtensionsList
