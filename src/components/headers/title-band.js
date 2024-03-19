import * as React from "react"

import styled from "styled-components"

const Band = styled.header`
  padding-left: var(--site-margins);
  padding-right: var(--site-margins);
  padding-top: 4rem;
  padding-bottom: 3rem;
  color: var(--title-text-color);
  text-align: left;
  font-size: var(--font-size-28);
  opacity: 1;
  margin: 0;
  background-color: var(--title-background-color);
  display: block; /* No flex, since otherwise we have to fuss with reproducing margin collapse */
`

const Heroic = styled.h1`
  font-size: 3rem;
  line-height: 3.75rem;
  font-weight: var(--font-weight-boldest);
  margin: 2.5rem 0 1.5rem 0;
`

const Modest = styled.h3`
  font-size: var(--font-size-24);
  line-height: 1.8rem;
  font-weight: 400;
  margin: 2.5rem 0 0 0;
`

const TitleBand = ({ title }) => {
  return (
    <Band>
      <Heroic>{title}</Heroic>
      <Modest>
        A Quarkiverse of extensions enhance your application just as project
        dependencies do.
      </Modest>
    </Band>
  )
}

export default TitleBand
