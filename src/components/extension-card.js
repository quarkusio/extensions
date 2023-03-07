import * as React from "react"
import Link from "gatsby-link"

import styled from "styled-components"
import prettyCategory from "./util/pretty-category"
import ExtensionImage from "./extension-image"

const Card = styled(props => <Link {...props} />)`
  font-size: 3.5em;
  text-align: center;
  transform: var(--transform);
  margin: 15px;
  padding: 20px;
  width: 220px;
  height: 490px;
  background: var(--white) 0 0 no-repeat padding-box;
  border: ${props =>
    props.$unlisted ? "1px solid var(--grey-0)" : "1px solid var(--grey-1)"};
  opacity: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

const LogoImage = styled.div`
  width: 80px;
  height: 80px;
  margin-bottom: 25px;
  display: flex;
  justify-content: center;
  align-items: center;
`

const ExtensionName = styled.div`
  text-align: left;
  font-size: var(--font-size-24);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0;
  color: ${props => (props.$unlisted ? "var(--grey-1)" : "var(--grey-2)")};
  opacity: 1;
  min-height: 66px;
`

const ExtensionDescription = styled.div`
  --num-lines: 7;
  color: var(--grey-2);
  text-align: left;
  font-size: var(--font-size-16);
  opacity: 1;
  margin-bottom: 20px;
  margin-top: 10px;
  line-height: calc(var(--font-size-16) * var(--line-height-multiplier));
  height: calc(
    var(--num-lines) * var(--font-size-16) * var(--line-height-multiplier)
  ); /* Set a cut-off point for the content; the number is the number of lines we are willing to show */
  overflow: hidden; /* Cut off the content */
  display: -webkit-box;
  -webkit-line-clamp: var(--num-lines);
  -webkit-box-orient: vertical;
`

const ExtensionInfo = styled.div`
  color: ${props => (props.$unlisted ? "var(--dark-red)" : "var(--grey-2)")};
  text-transform: ${props => (props.$unlisted ? "uppercase" : "none")};
  text-align: left;
  font-size: var(--font-size-16);
  opacity: 1;
  margin-top: 6px;
`
const MainInformation = styled.div`
  display: flex;
  flex-direction: column;
  padding-bottom: 30px;
`
const FinerDetails = styled.div`
  display: flex;
  flex-direction: column;
  padding-bottom: 30px;
`

const Logo = ({ extension }) => {
  return (
    <LogoImage>
      <ExtensionImage extension={extension} size={80} />
    </LogoImage>
  )
}

const ExtensionCard = ({ extension }) => {
  const unlisted = extension.metadata.unlisted

  return (
    <Card to={extension.slug} $unlisted={unlisted}>
      <MainInformation>
        <Logo extension={extension} />
        <ExtensionName $unlisted={unlisted}>{extension.name}</ExtensionName>
        <ExtensionDescription>{extension.description}</ExtensionDescription>
      </MainInformation>
      <FinerDetails>
        {unlisted && (
          <ExtensionInfo $unlisted={unlisted}>Unlisted</ExtensionInfo>
        )}

        {extension.metadata.categories &&
          extension.metadata.categories.length > 0 && (
            <ExtensionInfo>
              Category: {prettyCategory(extension.metadata.categories[0])}
            </ExtensionInfo>
          )}

        {extension.metadata.maven?.version && (
          <ExtensionInfo>
            Version: {extension.metadata.maven?.version}
          </ExtensionInfo>
        )}
      </FinerDetails>
    </Card>
  )
}

export default ExtensionCard
