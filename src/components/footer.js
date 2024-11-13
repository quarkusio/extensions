import * as React from "react"
import { StaticImage } from "gatsby-plugin-image"
import styled from "styled-components"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useMediaQuery } from "react-responsive"
import { device } from "./util/styles/breakpoints"

const FooterBar = styled.footer`
  background-color: var(--navbar-background-color);
  color: var(--main-background-color);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-16);
  padding: calc(0.9 * var(--a-vsmall-space)) var(--site-margins);
  font-weight: var(--font-weight-normal);
  gap: calc(1.5 * var(--a-modest-space));

  // noinspection CssUnknownProperty
  @media ${device.sm} {
    flex-direction: column-reverse;
  }
`

const Spacer = styled.div`
  width: 6rem;
`

const Logo = styled(props => <a {...props} />)`
  background-color: var(--navbar-background-color);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  font-weight: var(--font-weight-bold);
`
const SponsorInfo = styled.div`
  background-color: var(--navbar-background-color);
  color: var(--navbar-text-color);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-size-12);
  font-weight: var(--font-weight-bold);
  gap: calc(.8 * var(--a-small-space));

  // noinspection CssUnknownProperty
  @media ${device.sm} {
    flex-direction: column;
    margin-top: 10px;

  }
`

const LegalText = styled(props => <a {...props} />)`
  margin: 8px;
  color: var(--navbar-text-color);
  text-decoration: underline;

`

const LicenseInfo = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: var(--font-size-12);
`

const PaddedIcon = styled(props => <FontAwesomeIcon {...props} />)`
  margin-left: 1px;
  margin-right: 1px;
  color: var(--navbar-text-color);
`

const Footer = () => {
  const isMobile = useMediaQuery({ query: device.sm })

  return (
    <FooterBar className="navigation">
      {isMobile || <Spacer />}
      <LicenseInfo>
        <PaddedIcon icon={["fab", "creative-commons"]} />
        <PaddedIcon icon={["fab", "creative-commons-by"]} />
        <LegalText href="https://creativecommons.org/licenses/by/3.0/">
          CC by 3.0
        </LegalText>
        <span>|</span>
        <LegalText href="https://www.redhat.com/en/about/privacy-policy">Privacy Policy</LegalText>
      </LicenseInfo>
      <SponsorInfo>
        Sponsored by
        <Logo href="https://www.redhat.com/">
          <StaticImage
            className="logo"
            placeholder="none"
            backgroundColor="black"
            layout="constrained"
            formats={["auto", "webp", "avif"]}
            src="../images/redhat_reversed.svg"
            alt="Red Hat logo"
            height={26}
          />
        </Logo>
      </SponsorInfo>
    </FooterBar>
  )
}

export default Footer
