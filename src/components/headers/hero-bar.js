import * as React from "react"

import styled from "styled-components"

const HeroBart = styled.header`
  height: 300px;
  padding-left: var(--site-margins);
  padding-right: var(--site-margins);
  color: var(--white);
  text-align: left;
  font-size: var(--font-size-28);
  opacity: 1;
  margin: 0;
  background-color: var(--dark-blue-alt);
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: flex-start;
  padding-top: 4rem;
  padding-bottom: 3rem;
`

const Heroic = styled.h1`
  font-size: var(--font-size-48);
  line-height: 3.75rem;
  font-weight: 700;
  margin: 2.5rem 0 1.5rem 0;
`

const Modest = styled.h3`
  font-size: var(--font-size-24);
  line-height: 1.8rem;
  font-weight: 400;
  margin: 2.5rem 0 1.5rem 0;
`

const HeroBar = ({ title }) => {
  return (
    <div>
      <HeroBart>
        <Heroic>{title}</Heroic>
        <Modest>
          A Quarkiverse of extensions enhance your application just as project
          dependencies do.
        </Modest>
      </HeroBart>
    </div>
  )
}

export default HeroBar
