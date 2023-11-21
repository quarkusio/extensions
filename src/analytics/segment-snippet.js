/* eslint no-template-curly-in-string: 0 */

// This is the segment snippet, with a few modifications
// The write key is parameterised for the gatsby plugin
// We check do not track and do not load anything if do not track is true

// Be aware that copying the segment snippet from the segment site results in double events; this is the version from the plugin source

// These are plugin properties, and it's more convenient to leave them in the form we copied the snippet from the plugin source
const host = "${host}"
const writeKey = "${writeKey}"
const loadImmediately = "${loadImmediately}"
const reallyTrackPageImmediately = "${reallyTrackPageImmediately}"

const anonymizeId = true

const methods = ["trackSubmit", "trackClick", "trackLink", "trackForm", "pageview", "identify", "reset", "group", "track", "ready", "alias", "debug", "page", "once", "off", "on", "addSourceMiddleware", "addIntegrationMiddleware", "setAnonymousId", "addDestinationMiddleware"]
const windowStub = methods.reduce(
  (prev, cur) => {
    const sep = prev.length > 0 ? "," : ""
    return `${prev}${sep} ${cur}: ()=>{}`
  }
  , ""
)

let snippet = `(function(){  var doNotTrack = navigator.doNotTrack == 1; if (doNotTrack){window.analytics={${windowStub}};}else {var analytics=window.analytics=window.analytics||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.methods=${JSON.stringify(methods)};analytics.factory=function(e){return function(){var t=Array.prototype.slice.call(arguments);t.unshift(e);analytics.push(t);return analytics}};for(var e=0;e<analytics.methods.length;e++){var key=analytics.methods[e];analytics[key]=analytics.factory(key)}analytics.load=function(key,e){var t=document.createElement("script");t.type="text/javascript";t.async=!0;t.src="${host}/analytics.js/v1/" + key + "/analytics.min.js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n);analytics._loadOptions=e};analytics._writeKey="${writeKey}";analytics.SNIPPET_VERSION="4.15.3";`
if (anonymizeId) {
  snippet += "analytics.reset();"
}
if (loadImmediately) {
  snippet += `
    gatsbySegmentLoad('${writeKey}');`
  // Only track if it has been loaded
  if (reallyTrackPageImmediately) {
    snippet += `
    window.gatsbyPluginSegmentPageviewCaller();`
  }
}
snippet += `
  }}})();`

const segmentSnippet = snippet

module.exports = { segmentSnippet }