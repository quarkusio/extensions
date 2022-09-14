import * as React from "react"

import styled from "styled-components"

const HeroBart = styled.header`
  height: 300px;
  color: var(--white);
  text-align: left;
  font-size: var(--font-size-28);
  opacity: 1;
  margin: 0;
  background-color: var(--quarkus-blue);
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
`

const Heroic = styled.h1`
  font-size: var(--font-size-72);
  margin: 0px;
  font-weight: var(--font-weight-normal);
  text-transform: uppercase;
  letter-spacing: 12.96px;
`

const StyledLink = styled.a`
  text-decoration: underline;
  color: var(--white);
  margin-left: var(--a-small-space);
  margin-right: var(--a-small-space);
`

const HeroBar = ({ title }) => {
  return (
    <div>
      <HeroBart>
        <Heroic>{title}</Heroic>
        <span>
          Your home for community created extensions that broaden the reach and
          capabilities of Quarkus.
        </span>
        <span>
          <StyledLink href="https://quarkus.io/faq/#what-is-a-quarkus-extension">
            What are Extensions?
          </StyledLink>
          |
          <StyledLink href="https://access.redhat.com/documentation/en-us/red_hat_build_of_quarkus/1.3/html/developing_and_compiling_your_quarkus_applications_with_apache_maven/proc-installing-and-managing-java-extensions-with-quarkus-applications_quarkus-maven#doc-wrapper">
            How do I use them?
          </StyledLink>
        </span>
      </HeroBart>
    </div>
  )
}

export default HeroBar
