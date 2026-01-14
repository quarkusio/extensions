import * as React from "react"
import Link from "gatsby-link"
import { format, isValid } from "date-fns"

import styled from "styled-components"
import prettyCategory from "./util/pretty-category"
import ExtensionImage from "./extension-image"

const Card = styled(props => <Link {...props} />)`
  font-size: 3.5em;
  text-align: center;
  padding: 1rem;
  width: 100%;
  background: var(--card-background-color) 0 0 no-repeat padding-box;
  color: var(--main-text-color);
  border: ${props =>
          props.$unlisted || props.$superseded ? "1px solid var(--unlisted-outline-color)" : "1px solid var(--card-outline)"};
  border-radius: 10px;
  opacity: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  &:hover,
  :focus {
    background-color: var(--card-background-color-hover);
    border: 1px solid var(--card-background-color-hover);
  }
`

const LogoImage = styled.div`
  width: 80px;
  height: 80px;
  margin-bottom: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  overflow: hidden;
`

const ExtensionName = styled.div`
  --num-lines: 2.05; // Add a bit of padding so g and other hanging letters don't get cut off
  --font-size: 1.25rem;
  --line-height: calc(var(--font-size) * 1.1); // Squish long names a tiny bit
  text-align: left;
  font-size: var(--font-size);
  font-weight: var(--font-weight-awfully-bold);
  letter-spacing: 0;
  color: ${props => (props.$unlisted || props.superseded ? "var(--card-outline)" : "var(--main-text-color)")};
  opacity: 1;
  width: 100%;
  padding-bottom: 2px;
  margin-bottom: 8px;
  line-height: var(--line-height);
  min-height: calc(1.05 * var(--line-height));
  max-height: calc((var(--num-lines)) * var(--line-height));
  /* Set a cut-off point for the content; the number is the number of lines we are willing to show. 
  Allow it to drop below if it wants. 
  Because the description butts to the bottom of the name, this does cause a bit of raggediness internally, but it means 
  we can shrink cards if all the titles are short. */
  overflow: hidden; /* Cut off the content */
  display: -webkit-box;
  -webkit-line-clamp: var(--num-lines);
  -webkit-box-orient: vertical;
`

const ExtensionDescription = styled.div`
  --num-lines: 3.05; // Add a bit of padding so g and other hanging letters don't get cut off
  --font-size: var(--font-size-14);
  --line-height: calc(var(--font-size) * var(--line-height-multiplier));
  color: var(--main-text-color);
  text-align: left;
  font-size: var(--font-size);
  opacity: 1;
  padding-bottom: 2px; /* Give a little more space to dangling gs, without showing the next line of text */
  margin-bottom: 8px;
  margin-top: 10px;
  line-height: var(--line-height);
  min-height: calc((var(--num-lines) - 2) * var(--line-height));
  max-height: calc((var(--num-lines) + 2) * var(--line-height));
  /* Set a cut-off point for the content; the number is the number of lines we are willing to show */
  overflow: hidden; /* Cut off the content */
  display: -webkit-box;
  -webkit-line-clamp: var(--num-lines);
  -webkit-box-orient: vertical;
`

const ExtensionInfo = styled.div`
  color: ${props => (props.$unlisted ? "var(--danger-color)" : props.$superseded ? "var(--breadcrumb-background-color)" : "var(--main-text-color)")};
  text-transform: ${props => (props.$unlisted || props.$superseded ? "uppercase" : "none")};
  text-align: left;
  font-size: 0.7rem;
  opacity: 1;
  margin-top: 6px;
`
const MainInformation = styled.div`
  display: flex;
  flex-direction: column;
`
const ExtensionLogoAndStatus = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`
const FinerDetails = styled.div`
  display: flex;
  flex-direction: column;
`
const ExtensionStatus = styled.div`
  text-transform: uppercase;
  font-weight: bold;
  color: white;
  display: inline;
  background: ${props => props.$status == "deprecated" ? "#6a737d" : props.$status == "preview" ? "#F18F01" : props.$status == "experimental" ? "#FF004A" : "#4695EB"};
  margin: 5px;
  padding: 3px 7px;
  border-radius: 20px;
  font-size: 0.9rem;
  height: 1.2rem;
`
const ConditionalExtensionStatus = ({ status }) => {
  if(status && status != "stable") {
    return (<ExtensionStatus $status={status}>{status}</ExtensionStatus>);
  } else {
    return null;
  }
}


const Logo = ({ extension }) => {
  return (
    <LogoImage>
      <ExtensionImage extension={extension} size={80} />
    </LogoImage>
  )
}

const spacer = "\u00A0"

const ExtensionCard = ({ extension }) => {
  const unlisted = extension.metadata.unlisted
  const superseded = extension.isSuperseded

  return (
    <Card to={"/" + extension.slug} $unlisted={unlisted} $superseded={superseded}>
      <MainInformation>
        <ExtensionLogoAndStatus>
          <Logo extension={extension} />
          <ConditionalExtensionStatus status={extension.metadata?.status} />
        </ExtensionLogoAndStatus>
        <ExtensionName $unlisted={unlisted} $superseded={superseded}>{extension.name}</ExtensionName>

        <ExtensionDescription>{extension.description}</ExtensionDescription>
      </MainInformation>
      <FinerDetails>
        <ExtensionInfo $unlisted={unlisted} $superseded={superseded}>
          {unlisted ? "Unlisted" : superseded ? "Relocated" : spacer}
        </ExtensionInfo>
        <ExtensionInfo>
          {extension.metadata?.categories?.length > 0
            ? `Category: ${prettyCategory(extension.metadata.categories[0])}`
            : spacer}
        </ExtensionInfo>
        <ExtensionInfo>
          {extension.metadata.maven?.version
            ? `Latest version: ${extension.metadata.maven.version}`
            : spacer}
        </ExtensionInfo>
        <ExtensionInfo>
          {extension.metadata.maven?.timestamp &&
          isValid(+extension.metadata.maven?.timestamp)
            ? `Last released: ${format(
              new Date(+extension.metadata.maven.timestamp),
              "MMM dd, yyyy"
            )}`
            : spacer}
        </ExtensionInfo>
      </FinerDetails>
    </Card>
  )
}

export default ExtensionCard
