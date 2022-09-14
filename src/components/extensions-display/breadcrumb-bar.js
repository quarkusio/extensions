import * as React from "react"

import styled from "styled-components"
import Link from "gatsby-link"
import { faAngleRight } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

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
  font-weight: var(--font-weight-boldest);
  text-decoration: none;
  color: var(--white);
`

const PaddedIcon = styled(props => <FontAwesomeIcon {...props} />)`
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-20);
  margin-left: var(--a-modest-space);
  margin-right: var(--a-modest-space);
`

const BreadcrumbBar = ({ name }) => {
  return (
    <BreadcrumbBart>
      <StyledLink to="/">Extensions</StyledLink>
      <PaddedIcon icon={faAngleRight} />
      {name}
    </BreadcrumbBart>
  )
}

export default BreadcrumbBar
