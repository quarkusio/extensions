import * as React from "react"
import { StaticImage } from "gatsby-plugin-image"
import styled from "styled-components"
import { device } from "./util/styles/breakpoints"

const FooterBar = styled.footer`
    background-color: var(--navbar-background-color);
    color: var(--footer-text-color);
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    line-height: 1.5rem;
    font-size: var(--font-size-16);
    padding: 1rem var(--site-margins);
    font-weight: var(--font-weight-bold);
    gap: 2rem;

    // noinspection CssUnknownProperty
    @media ${device.sm} {
        flex-direction: column-reverse;
    }
`

const Logo = styled(props => <a {...props} />)`
    background-color: var(--navbar-background-color);
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
`

const SponsorInfo = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    text-wrap: nowrap;
    font-size: var(--font-size-12);
    gap: calc(.8 * var(--a-small-space));

    // noinspection CssUnknownProperty
    @media ${device.sm} {
        flex-direction: column;
        margin-top: 10px;

    }
`

const LegalText = styled(props => <a {...props} />)`
    color: var(--footer-text-color);
    text-decoration: underline;
`

const LicenseInfo = styled.div`
    font-size: 0.75rem;

    a {
        color: var(--footer-text-color);
    }

    @media screen and (max-width: 1024px) {
        justify-self: left;
        padding: 1rem 0;
    }
`

const Footer = () => {

  return (
    <FooterBar className="navigation">
      <Logo href="https://www.commonhaus.org/" style={{ maxWidth: "350px" }}>
        <StaticImage
          className="logo"
          placeholder="none"
          backgroundColor="black"
          layout="constrained"
          formats={["auto", "webp", "avif"]}
          src="../images/CF_logo_horizontal_single_reverse.svg"
          alt="CommonHaus logo"
          minWidth="350px"
          maxWidth="100%"
        />
      </Logo>

      <LicenseInfo>
        Copyright © Quarkus. All rights reserved. For details on our trademarks, please visit our <LegalText
        href="https://www.commonhaus.org/policies/trademark-policy/">Trademark Policy</LegalText> and <LegalText
        href="https://www.commonhaus.org/trademarks/">Trademark List</LegalText>. Trademarks of third parties are owned
        by their respective holders and their mention here does not suggest any endorsement or association.
      </LicenseInfo>
    </FooterBar>
  )
}

export default Footer
