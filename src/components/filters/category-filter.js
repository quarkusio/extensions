import React, { useState } from "react"
import styled from "styled-components"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

import Title from "./title"
import prettyCategory from "../util/pretty-category"

const Element = styled.div`
  padding-top: 36px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
`

const Category = styled.li`
  font-size: var(--font-size-18);
  color: var(--black);
  display: flex;
  padding: 0;
  gap: 8px;
`

const Categories = styled.ul`
  list-style: none;
  padding: 0;
  margin: 10px;
  line-height: 23px;
`

const TickyBox = styled(props => <FontAwesomeIcon {...props} />)`
  font-size: 16px;
`

const toggleCategory = (
  category,
  tickedCategories,
  setTickedCategories,
  filterer
) => {
  if (tickedCategories.includes(category)) {
    tickedCategories = tickedCategories.filter(item => item !== category)
  } else {
    tickedCategories = [...tickedCategories, category] // It's important to make a new array or nothing will be re-rendered
  }
  setTickedCategories(tickedCategories)
  filterer && filterer(tickedCategories)
}

const CategoryFilter = ({ categories, filterer }) => {
  const [tickedCategories, setTickedCategories] = useState([])

  return (
    <Element>
      <Title>Category</Title>
      <Categories>
        {categories &&
          categories.map(category => (
            <Category
              key={category}
              onClick={() =>
                toggleCategory(
                  category,
                  tickedCategories,
                  setTickedCategories,
                  filterer
                )
              }
            >
              <div>
                {tickedCategories.includes(category) ? (
                  <TickyBox icon="square-check" title="ticked" />
                ) : (
                  <TickyBox icon={["far", "square"]} title="unticked" />
                )}
              </div>
              <div>{prettyCategory(category)}</div>
            </Category>
          ))}
      </Categories>
    </Element>
  )
}

export default CategoryFilter
