import * as React from "react"
import Filters from "./filters"
import ExtensionCard from "./extension-card"

const ExtensionsList = ({ extensions }) => {
  // TODO why is this guard necessary?
  console.log("extensions is ", extensions)
  if (extensions) {
    return (
      <div className="extensions-list" style={{ display: "flex" }}>
        <Filters />
        <ol
          style={{
            listStyle: `none`,
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            width: "1262px",
          }}
        >
          {extensions.map(extension => {
            return (
              <li key={extension.name}>
                <ExtensionCard extension={extension} />
              </li>
            )
          })}
        </ol>
      </div>
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
