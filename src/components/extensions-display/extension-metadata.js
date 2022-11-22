import * as React from "react"

import styled from "styled-components"

const MetadataBlock = styled.div`
  width: 50%;
  height: 60px;
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

const ExtensionMetadata = ({
  data: { name, plural, fieldName, metadata, transformer },
}) => {
  const field = fieldName ? fieldName : name.toLowerCase()
  const content = metadata[field]

  const transform = element => (transformer ? transformer(element) : element)

  const prettyPrinted = Array.isArray(content)
    ? content.map(element => transform(element))
    : transform(content)

  return (
    <MetadataBlock>
      {plural && Array.isArray(content) && content.length > 1 ? (
        <MetadataTitle>{plural}</MetadataTitle>
      ) : (
        <MetadataTitle>{name}</MetadataTitle>
      )}
      {Array.isArray(prettyPrinted) ? (
        prettyPrinted.map(
          (element, i) =>
            element && <MetadataValue key={i}>{element}</MetadataValue>
        )
      ) : (
        <MetadataValue>{prettyPrinted}</MetadataValue>
      )}
    </MetadataBlock>
  )
}

export default ExtensionMetadata
