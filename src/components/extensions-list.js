import * as React from "react"
import Filters from "./filters"
import ExtensionCard from "./extension-card"

const ExtensionsList = () => {
  return (
    <div className="extensions-list" style={{ display: "flex" }}>
      <Filters />
      <div>
        <ExtensionCard />
      </div>
    </div>
  )
}

export default ExtensionsList
