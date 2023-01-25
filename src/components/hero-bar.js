import * as React from "react"

import styled from "styled-components"

const HeroBart = styled.header`
  height: 300px;
  padding-left: var(--a-boatload-of-space);
  padding-right: var(--a-boatload-of-space);
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

const StyledLink = styled.a`
  font-size: var(--font-size-20);
  line-height: 1.8rem;
  font-weight: 400;
  text-decoration: underline;
  color: var(--white);
`

const Links = styled.div`
  display: flex;
  gap: 1rem;
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
        <Links>
          <StyledLink href="https://quarkus.io/faq/#what-is-a-quarkus-extension">
            What are Extensions?
          </StyledLink>
          <span>|</span>
          <StyledLink href="https://access.redhat.com/documentation/en-us/red_hat_build_of_quarkus/1.3/html/developing_and_compiling_your_quarkus_applications_with_apache_maven/proc-installing-and-managing-java-extensions-with-quarkus-applications_quarkus-maven#doc-wrapper">
            How do I use them?
          </StyledLink>
        </Links>
      </HeroBart>
    </div>
  )
}

export default HeroBar
