import * as React from "react"

import styled from "styled-components"
import Link from "gatsby-link"

const BreadcrumbBart = styled.header`
  height: 90px;
  color: var(--white);
  text-align: left;
  font-size: var(--font-size-24);
  opacity: 1;
  margin: 0;
  padding-left: var(--a-boatload-of-space);
  background-color: var(--quarkus-blue);
  display: flex;
  justify-content: flex-start;
  align-items: center;
`
const StyledLink = styled(props => <Link {...props} />)`
  font-weight: var(--font-weight-bold);
  text-decoration: none;
  color: var(--white);
`

const BreadcrumbBar = ({ name }) => {
  return (
    <BreadcrumbBart>
      <StyledLink to="/">Extensions &#12297;</StyledLink> {name}
    </BreadcrumbBart>
  )
}

export default BreadcrumbBar
