import * as React from "react"

import styled from "styled-components"

const MetadataBlock = styled.div`
  color: var(--grey-2);
  text-align: left;
  font-size: var(--font-size-16);
  margin-bottom: var(--a-small-space);
  margin-top: var(--a-small-space);
  padding-bottom: var(--a-modest-space);
  padding-top: var(--a-modest-space);
  border-bottom: 1px solid var(--grey-1);
`

const MetadataTitle = styled.div`
  margin-bottom: var(--a-small-space);
`

const MetadataValue = styled.div`
  font-weight: var(--font-weight-bold);
`

const ExtensionMetadata = ({ data: { name, fieldName, metadata } }) => {
  const field = fieldName ? fieldName : name.toLowerCase()
  const content = metadata[field]

  return (
    <MetadataBlock>
      <MetadataTitle>{name}</MetadataTitle>
      {Array.isArray(content) ? (
        content.map((element, i) => (
          <MetadataValue key={i}>{element}</MetadataValue>
        ))
      ) : (
        <MetadataValue>{content}</MetadataValue>
      )}
    </MetadataBlock>
  )
}

export default ExtensionMetadata
