import React from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import styled from "styled-components"

const CopyButton = styled.button`
  border: none;
`

const CopyToClipboard = ({ children }) => {
  const doCopy = () => {
    navigator.clipboard.writeText(children)
  }

  return (
    <React.Fragment>
      {children}
      <CopyButton onClick={doCopy}>
        <FontAwesomeIcon icon="clipboard" />
      </CopyButton>
    </React.Fragment>
  )
}

export default CopyToClipboard
