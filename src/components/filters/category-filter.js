import React from "react"
import TickyFilter from "./ticky-filter"

const CategoryFilter = ({ categories, filterer }) => {
  // Sort categories: platform first (alphabetically), then non-platform (alphabetically)
  const sortedCategories = categories ? [...categories].sort((a, b) => {
    // Platform categories come first
    if (a.isPlatform && !b.isPlatform) return -1
    if (!a.isPlatform && b.isPlatform) return 1

    // Within each group, sort alphabetically by name
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  }) : []

  // Pass full category objects to TickyFilter so it can apply styling based on isPlatform
  return (
    categories && <TickyFilter label="Category" queryKey="categories" entries={sortedCategories} filterer={filterer} />
  )
}

export default CategoryFilter
