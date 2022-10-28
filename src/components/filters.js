import * as React from "react"
import { StaticImage } from "gatsby-plugin-image"
import styled from "styled-components"

const FilterBar = styled.aside`
  width: 224px;
  padding-top: 36px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
`

const Filters = () => {
  return (
    <FilterBar className="filters">
      <div style={{ width: "224px", height: "1px" }}></div>
      <StaticImage
        className="fake-content"
        layout="constrained"
        formats={["auto", "webp", "avif"]}
        src="../images/filters.png"
        width={282}
        height={1160}
        alt="A list of dummy extensions"
      />
    </FilterBar>
  )
}

export default Filters
