/**
 * Implement Gatsby's SSR (Server Side Rendering) APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/ssr-apis/
 */

export const onRenderBody = ({ setBodyAttributes, setHtmlAttributes }) => {
  //setPreBodyComponents(<MagicScriptTag />)
  // setPreBodyComponents(<div>HI</div>)
  setHtmlAttributes({ lang: `en` })// Affect the HTML that gets loaded before React here
  setBodyAttributes({
    style: {
      backgroundColor: "var(--main-background-color)"
    }
  })
}