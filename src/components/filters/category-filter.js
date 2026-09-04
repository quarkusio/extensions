import React from "react"
import TickyFilter from "./ticky-filter"

const CategoryFilter = ({ categories, filterer }) => {
  // Extract category IDs for the filter entries (used in query params)
  const categoryIds = categories?.map(c => c.categoryId) || []

  // Create a map from category ID to display name.
  // gatsby-node.js always sets name on every Category node (falling back to prettyCategory there),
  // so every entry passed here is guaranteed to have a name.
  const categoryMap = new Map()
  categories?.forEach(c => {
    categoryMap.set(c.categoryId, c.name)
  })

  return (
    categories && <TickyFilter label="Category" queryKey="categories" entries={categoryIds} filterer={filterer}
                               prettify={categoryId => categoryMap.get(categoryId)} />
  )
}

export default CategoryFilter
