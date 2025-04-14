import styled from "styled-components"
import { device } from "../util/styles/breakpoints"

export const FilterableList = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;

  // noinspection CssUnknownProperty
  @media ${device.sm} {
    flex-direction: column;
  }
`

export const Extensions = styled.ol`
  list-style: none;
  width: 100%;
  padding-inline-start: 0;
  grid-template-rows: repeat(auto-fill, 1fr);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 30px;

  // noinspection CssUnknownProperty
  @media ${device.xs} {
    display: flex;
    flex-direction: column;
  }
`

export const CardItem = styled.li`
  height: 100%;
  width: 100%;
  display: flex;
  max-height: 34rem;
`

export const InfoSortRow = styled.div`
  display: flex;
  column-gap: var(--a-generous-space);
  justify-content: space-between;
  flex-direction: row;

  // noinspection CssUnknownProperty
  @media ${device.sm} {
    flex-direction: column;
    margin-top: 0;
  }
`


export const ExtensionListHeading = styled.h1`
  font-size: 3rem;
  @media screen and (max-width: 768px) {
    font-size: 2rem;
  }
  font-weight: var(--font-weight-boldest);
  margin: 2.5rem 0 1.5rem 0;
  padding-bottom: var(--a-modest-space);
  width: calc(100vw - 2 * var(--site-margins));
  // noinspection CssUnknownProperty
  @media ${device.xs} {
    border-bottom: 1px solid var(--card-outline);
  }
`

export const ExtensionCount = styled.h4`
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  font-weight: 400;
  font-style: italic;

  // noinspection CssUnknownProperty
  @media ${device.sm} {
    font-size: var(--font-size-14);
  }
`