import styled from "styled-components"
import { device } from "../util/styles/breakpoints"

const Title = styled.label`
  width: 224px;
  font-size: var(--font-size-18);
  letter-spacing: 0;
  color: var(--sec-text-color);
  margin-top: 36px;

  display: block;

  // noinspection CssUnknownProperty
  @media ${device.sm} {
    padding-top: 0;
    padding-bottom: 0;
    margin-top: 0;
    margin-bottom: 0;
  }
`

export default Title
