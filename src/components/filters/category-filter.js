import React, { useEffect } from "react"
import styled from "styled-components"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

import Title from "./title"
import prettyCategory from "../util/pretty-category"
import { getQueryParams, useQueryParamString } from "react-use-query-param-string"

const Element = styled.div`
  padding-top: 36px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
`

const Category = styled.li`
  font-size: var(--font-size-16);
  color: var(--main-text-color);
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
  color: var(--main-text-color);
`

const separator = ","

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
  if (tickedCategories.length > 0) {
    setTickedCategories(tickedCategories?.join(separator))
  } else {
    // Clear this filter from the URL bar if there's nothing in it
    setTickedCategories(undefined)
  }
  filterer && filterer(tickedCategories)
}

const key = "categories"
const CategoryFilter = ({ categories, filterer }) => {
  const [stringedTickedCategories, setTickedCategories, initialized] = useQueryParamString(key, undefined, true)
  const realStringedTickedCategories = initialized ? stringedTickedCategories : getQueryParams() ? getQueryParams()[key] : undefined

  const tickedCategories = stringedTickedCategories ? stringedTickedCategories.split(separator) : []

  const onClick = category => () =>
    toggleCategory(
      category,
      tickedCategories,
      setTickedCategories,
      filterer
    )

  useEffect(() => {  // Make sure that even if the url is pasted in a browser, the list updates with the right value
    if (realStringedTickedCategories && realStringedTickedCategories.length > 0) {
      filterer(realStringedTickedCategories.split(separator))
    }
  }, [realStringedTickedCategories], filterer)
  
  return (
    categories && <Element>
      <Title>Category</Title>
      <Categories>
        {categories &&
          categories.map(category => (
            <Category
              key={category}
              onClick={onClick(category)
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
