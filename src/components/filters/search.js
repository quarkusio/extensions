import * as React from "react"
import { useEffect } from "react"
import styled from "styled-components"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSearch } from "@fortawesome/free-solid-svg-icons"
import { getQueryParams, useQueryParamString } from "react-use-query-param-string"
import { device } from "../util/styles/breakpoints"

const Element = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;

  // noinspection CssUnknownProperty
  @media ${device.sm} {
    align-items: center;
    padding-left: var(--mobile-filter-margins);
    padding-right: var(--mobile-filter-margins);
  }
`

const SearchBox = styled.div`
  border: 1px solid var(--controls-outline-color);
  height: 36px;
  width: 224px;
  display: flex;
  flex-direction: row;
  align-items: center;

  // noinspection CssUnknownProperty
  @media ${device.sm} {
    width: 100%;
    margin-bottom: var(--a-small-space)
  }

  &:focus-within {
    outline: var(--breadcrumb-background-color) solid 2px;
  }
`

const Input = styled.input`
  padding: 0;
  border: 0;
  font-size: var(--font-size-14);
  background-color: var(--main-background-color);
  color: var(--main-text-color);

  outline: none; // change to the defaults, which otherwise give a blue ring inside the white area
`

const PaddedIcon = styled(props => <FontAwesomeIcon {...props} />)`
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-16);
  margin-left: var(--a-vsmall-space);
  margin-right: var(--a-vsmall-space);
`

const key = "search-regex"

const Search = ({ searcher: listener }) => {
  const onInputChange = e => {
    if (e.target.value !== realSearchText) {
      const newValue = e.target.value !== "" ? e.target.value : undefined
      setSearchText(newValue)
    }
    //  Make sure the listener knows about the right values, even before any re-render
    listener(e.target.value)
  }

  const [searchText, setSearchText, initialized] = useQueryParamString(key, undefined, true)
  const realSearchText = initialized ? searchText : getQueryParams() ? getQueryParams()[key] : undefined

  useEffect(() => {  // Make sure that even if the url is pasted in a browser, the list updates with the right value
    if (realSearchText && realSearchText.length > 0) {
      listener(realSearchText)
    }
  }, [realSearchText, listener])


  return (
    <Element>
      <SearchBox>
        <PaddedIcon icon={faSearch} />

        <Input
          id={key}
          name={key}
          placeholder="Find an extension"
          onChange={onInputChange}
          defaultValue={realSearchText}
        />
      </SearchBox>
    </Element>
  )
}

export default Search
