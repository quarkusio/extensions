import React, { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import styled from "styled-components"

const CopyButton = styled.button`
  border: none;
  background-color: transparent;
`

const CopyToClipboard = ({ children }) => {
  const doCopy = () => {
    navigator.clipboard.writeText(children)
    setButtonText("clipboard-check")
  }

  const [buttonText, setButtonText] = useState("clipboard")

  return (
    <React.Fragment>
      {children}
      <CopyButton onClick={doCopy}>
        <FontAwesomeIcon icon={buttonText} className="icon" />
      </CopyButton>
    </React.Fragment>
  )
}

export default CopyToClipboard
