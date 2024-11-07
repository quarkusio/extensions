import React from "react"
import prettyCategory from "../util/pretty-category"
import TickyFilter from "./ticky-filter"

const CategoryFilter = ({ categories, filterer }) => {
  return (
    categories && <TickyFilter label="Category" queryKey="categories" entries={categories} filterer={filterer}
                               prettify={prettyCategory} />
  )
}

export default CategoryFilter
