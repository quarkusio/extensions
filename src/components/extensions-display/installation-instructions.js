import * as React from "react"
import styled from "styled-components"
import CopyToClipboard from "../util/copy-to-clipboard"

const CodeBlock = styled.pre`
  background-color: var(--grey-0);
  border: 1px solid var(--grey-1);
  padding: 1rem;
  line-height: 1.2em;
  overflow-x: auto;
  color: var(--grey-4);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`

const InstallationInstructions = ({ artifact }) => {
  const shortName = artifact ? artifact.split("::")[0] : "group:artifact"
  return (
    <React.Fragment>
      <p>
        To add this extension to your project, use the relevant command in
        your Quarkus project directory:
      </p>
      <h3>Quarkus CLI</h3>
      <CodeBlock>
        <CopyToClipboard>
          {`quarkus ext add ${shortName}`}
        </CopyToClipboard>
      </CodeBlock>
      <h3>Maven</h3>
      <CodeBlock>
        <CopyToClipboard>
          {`./mvnw quarkus:add-extension -Dextensions="${shortName}"`}
        </CopyToClipboard>
      </CodeBlock>
      <h3>Gradle</h3>
      <CodeBlock>
        <CopyToClipboard>
          {`./gradlew addExtension --extensions="${shortName}"`}
        </CopyToClipboard>
      </CodeBlock>
    </React.Fragment>
  )
}

export default InstallationInstructions
