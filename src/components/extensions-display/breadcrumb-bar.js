import * as React from "react"

import styled from "styled-components"
import Link from "gatsby-link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { device } from "../util/styles/breakpoints"

const BreadcrumbBart = styled.header`
  color: var(--breadcrumb-text-color);
  text-align: left;
  font-size: var(--font-size-24);
  opacity: 1;
  margin: 0;
  padding-left: var(--site-margins);
  padding-right: var(--site-margins);
  padding-top: calc(1.2 * var(--a-modest-space));
  padding-bottom: calc(1.2 * var(--a-modest-space));
  background-color: var(--breadcrumb-background-color);
  display: flex;
  justify-content: flex-start;
  align-items: center;

  // noinspection CssUnknownProperty
  @media ${device.xs} {
    font-size: var(--font-size-16);
  }
`
const StyledLink = styled(props => <Link {...props} />)`
  font-weight: var(--font-weight-awfully-bold);
  text-decoration: none;
  color: var(--breadcrumb-text-color);

  &:visited {
    color: var(--breadcrumb-text-color);
  }
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
      <PaddedIcon icon="angle-right" />
      {name}
    </BreadcrumbBart>
  )
}

export default BreadcrumbBar
