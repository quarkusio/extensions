import React from "react"

export function FontAwesomeIcon(props) {
  let className = `fa ${props.icon}`
  return <i className={className} />
}
