import React, { useEffect } from "react"
import styled from "styled-components"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

import Title from "./title"
import { getQueryParams, useQueryParamString } from "react-use-query-param-string"
import prettyCategory from "../util/pretty-category"

const Element = styled.div`
  padding-top: 36px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
`

const Keyword = styled.li`
  font-size: var(--font-size-16);
  color: var(--main-text-color);
  display: flex;
  padding: 0;
  gap: 8px;
`

const Keywords = styled.ul`
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

const toggleKeyword = (
  keyword,
  tickedKeywords,
  setTickedKeywords,
  filterer
) => {
  if (tickedKeywords.includes(keyword)) {
    tickedKeywords = tickedKeywords.filter(item => item !== keyword)
  } else {
    tickedKeywords = [...tickedKeywords, keyword] // It's important to make a new array or nothing will be re-rendered
  }
  if (tickedKeywords.length > 0) {
    setTickedKeywords(tickedKeywords?.join(separator))
  } else {
    // Clear this filter from the URL bar if there's nothing in it
    setTickedKeywords(undefined)
  }
  filterer && filterer(tickedKeywords)
}

const key = "keywords"
const KeywordFilter = ({ keywords, filterer }) => {
  const [stringedTickedKeywords, setTickedKeywords, initialized] = useQueryParamString(key, undefined, true)
  const realStringedTickedKeywords = initialized ? stringedTickedKeywords : getQueryParams() ? getQueryParams()[key] : undefined

  const tickedKeywords = stringedTickedKeywords ? stringedTickedKeywords.split(separator).map(keyword => keyword.replaceAll("+", " ")) : []

  const onClick = keyword => () =>
    toggleKeyword(
      keyword,
      tickedKeywords,
      setTickedKeywords,
      filterer
    )

  useEffect(() => {  // Make sure that even if the url is pasted in a browser, the list updates with the right value
    if (realStringedTickedKeywords && realStringedTickedKeywords.length > 0) {
      filterer(realStringedTickedKeywords.split(separator))
    }
  }, [realStringedTickedKeywords, filterer])

  return (
    keywords && <Element>
      <Title>Keyword</Title>
      <Keywords>
        {keywords &&
          keywords.map(keyword => (
            <Keyword
              key={keyword}
              onClick={onClick(keyword)
              }
            >
              <div>
                {tickedKeywords.includes(keyword) ? (
                  <TickyBox icon="square-check" title="ticked" />
                ) : (
                  <TickyBox icon={["far", "square"]} title="unticked" />
                )}
              </div>
              <div>{prettyCategory(keyword)}</div>
            </Keyword>
          ))}
      </Keywords>
    </Element>
  )
}

export default KeywordFilter
