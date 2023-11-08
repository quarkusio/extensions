import styled from "styled-components"
import ExtensionImage from "../extension-image"
import * as React from "@types/react"

// These live in their own file to reduce duplication in the pages for the individual extensions

export const ExtensionDetails = styled.main`
  margin-left: var(--site-margins);
  margin-right: var(--site-margins);
  margin-top: var(--a-generous-space);
  margin-bottom: var(--a-generous-space);

  display: flex;
  flex-direction: column;
`

export const Headline = styled.header`
  height: 160px;
  display: flex;
  flex-direction: row;
  margin-bottom: 62px;
  align-items: center;
`

export const UnlistedWarning = styled.header`
  padding-left: var(--site-margins);
  background-color: var(--grey-0);
  text-align: left;
  font-size: var(--font-size-24);
  font-weight: var(--font-weight-bold);
  color: var(--grey-2);
  padding-top: var(--a-modest-space);
  padding-bottom: var(--a-modest-space);
`

export const SupersededWarning = styled.header`
  padding-left: var(--site-margins);
  background-color: var(--soft-yellow);
  text-align: left;
  font-size: var(--font-size-24);
  font-weight: var(--font-weight-bold);
  padding-top: var(--a-modest-space);
  padding-bottom: var(--a-modest-space);
`

export const Columns = styled.div`
  display: flex;
  flex-direction: row;
`

export const LogoImage = styled.div`
  width: 220px;
  margin-right: 60px;
  margin-bottom: 25px;
  border-radius: 10px;
  overflow: hidden;
`

export const Metadata = styled.div`
  flex-grow: 1;
  padding-left: 30px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-content: flex-start;
`

export const MainContent = styled.div`
  width: 70%;
  display: flex;
  flex-direction: column;
`

export const ExtensionName = styled.div`
  text-align: left;
  font-size: var(--font-size-48);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0;
  color: var(--grey-2);
  text-transform: uppercase;
  opacity: 1;
`

export const ExtensionDescription = styled.div`
  color: var(--grey-2);
  text-align: left;
  font-size: var(--font-size-16);
  opacity: 1;
  margin-bottom: 3rem;
  margin-top: 2.5rem;
  font-weight: var(--font-weight-bold);
`

export const DocumentationSection = styled.section`
  margin-top: 2.5rem;
  margin-bottom: 50px;
`

export const DuplicateReference = styled.div``
export const MavenCoordinate = styled.span`
  font-weight: var(--font-weight-bold);
`

export const VisibleLink = styled.a`
  &:link {
    color: var(--link);
    text-decoration: underline;
  }

  &:visited {
    color: var(--link-visited);
    text-decoration: underline;
  }
`

export const DocumentationHeading = styled.h2`
  text-transform: uppercase;
  font-weight: var(--font-weight-normal);
  font-size: var(--font-size-24);
  padding-bottom: 10px;
`

//  I wish this wasn't here, but we need to set an explicit height for the charts, or the contents don't render at all
export const ChartHolder = styled.div`
  height: 480px; // For now, an arbitrary height, but we should tune
`

export const Logo = ({ extension }) => {
  return (
    <LogoImage>
      <ExtensionImage extension={extension} size={220} />
    </LogoImage>
  )
}

export const AuthorGuidance = styled.div`
  font-style: italic;
  padding-top: 2rem;
`

export const Filename = styled.span`
  font-family: monospace;
`

export const ClosingRule = styled.div`
  width: 100%;
  position: relative;
  top: -1px;
  padding-left: var(--a-modest-space);
  border-bottom: 1px solid var(--grey-1);`