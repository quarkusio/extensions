import * as React from "react"
import styled from "styled-components"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

const Element = styled.div`
  width: 224px;
  padding-top: 36px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
`

const Title = styled.div`
  font-size: var(--font-size-22);
  letter-spacing: 0;
  color: var(--grey-2);
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

const CategoryFilter = ({ categories }) => {
  return (
    <Element>
      <Title>Category</Title>
      <Categories>
        {categories &&
          categories.map(
            category =>
              category &&
              category.length > 0 && (
                <Category key={category}>
                  <div>
                    <TickyBox icon={["far", "square"]} />
                  </div>
                  <div>{category}</div>
                </Category>
              )
          )}
      </Categories>
    </Element>
  )
}

export default CategoryFilter
