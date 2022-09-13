import * as React from "react"
import Filters from "./filters"
import ExtensionCard from "./extension-card"

const ExtensionsList = ({ extensions }) => {
  console.log("extensions is ", extensions)
  return (
    <div className="extensions-list" style={{ display: "flex" }}>
      <Filters />
      <ol
        style={{
          listStyle: `none`,
          display: "flex",
          flexDirection: "row",
          width: "1262px",
        }}
      >
        {extensions.map(extension => {
          return (
            <li key={extension.fields.slug}>
              <ExtensionCard extension={extension} />
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default ExtensionsList
