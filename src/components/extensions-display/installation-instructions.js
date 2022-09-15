import * as React from "react"
import styled from "styled-components"

const CodeBlock = styled.pre`
  background-color: var(--grey-0);
  border: 1px solid var(--grey-1);
  padding: 1rem;
  line-height: 1.2em;
  overflow-x: auto;
  color: var(--grey-4);
`

const InstallationInstructions = ({ artifact }) => {
  const shortName = artifact ? artifact.split("::")[0] : "group:artifact"
  return (
    <fragment>
      <p>
        To add this extension to your project, enter the following command in
        your Quarkus project directory:
      </p>
      <CodeBlock>
        {`./mvnw quarkus:add-extension -Dextensions="${shortName}"`}
      </CodeBlock>
    </fragment>
  )
}

export default InstallationInstructions
