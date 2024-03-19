import * as React from "react"

import styled from "styled-components"
import codeQuarkusUrl from "../util/code-quarkus-url"

const Button = styled(props => <a {...props} />)`
  color: var(--navbar-text-color);
  display: flex;
  justify-content: center;

  white-space: nowrap;

  background-color: var(--quarkus-blue);
  border-radius: var(--border-radius);

  padding: 0.5rem 2rem;

  &:visited {
    color: var(--navbar-text-color);
  }

  &:hover {
    color: var(--navbar-text-color);
    background-color: var(--dark-red);
  }
`
const CallToAction = styled.span`
  font-weight: var(--font-weight-awfully-bold);
  text-decoration: none;
  text-transform: uppercase;
  text-align: center;
`

// Used to ensure nothing wraps onto the same row as this, and also to center it since align-self wasn't being honoured
const RowHog = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: var(--a-modest-space);
`

const CodeLink = ({ artifact, unlisted, platforms, streams }) => {
  const url = codeQuarkusUrl({ artifact, unlisted, platforms, streams })
  if (url) {
    return (
      <>
        <RowHog>
          <Button href={url}>
            <CallToAction>Try This Extension</CallToAction>
          </Button>
        </RowHog>
      </>
    )
  }
}

export default CodeLink
