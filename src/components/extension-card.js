import * as React from "react"
import { StaticImage } from "gatsby-plugin-image"
import Link from "gatsby-link"

import styled from "styled-components"

const Card = styled(props => <Link {...props} />)`
  font-size: 3.5em;
  text-align: center;
  transform: var(--transform);
  margin: 15px;
  padding: 20px;
  width: 263px;
  height: 490px;
  background: var(--white) 0 0 no-repeat padding-box;
  border: 1px solid var(--grey-1);
  opacity: 1;
  display: flex;
  flex-direction: column;
`

const Logo = styled.div`
  width: 80px;
  height: 56px;
  margin-bottom: 25px;
`

const ExtensionName = styled.div`
  text-align: left;
  font-size: var(--font-size-24);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0;
  color: var(--grey-2);
  opacity: 1;
  height: 66px;
`

const ExtensionDescription = styled.div`
  color: var(--grey-2);
  text-align: left;
  font-size: var(--font-size-16);
  opacity: 1;
  margin-bottom: 10px;
  margin-top: 10px;
`

const ExtensionCategory = styled.div`
  color: var(--grey-2);
  text-align: left;
  font-size: var(--font-size-16);
  opacity: 1;
  margin-bottom: 10px;
  margin-top: 10px;
`

const ExtensionCard = ({ extension }) => {
  return (
    <Card to={extension.slug}>
      <Logo>
        <StaticImage
          layout="constrained"
          formats={["auto", "webp", "avif"]}
          src="../images/generic-extension-logo.png"
          alt="The extension logo"
        />
      </Logo>
      <ExtensionName>{extension.name}</ExtensionName>
      <ExtensionDescription>{extension.description}</ExtensionDescription>

      {extension.metadata.categories &&
        extension.metadata.categories.length > 0 && (
          <ExtensionCategory>
            Category: {extension.metadata.categories[0]}
          </ExtensionCategory>
        )}
    </Card>
  )
}

export default ExtensionCard
