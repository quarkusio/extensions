const React = require("react");
const gatsby = jest.requireActual("gatsby");
module.exports = {
  ...gatsby,
  graphql: jest.fn().mockResolvedValue({
    data: {
      allMarkdownRemark: {
        edges: [
          { node: { frontmatter: { category: "test-stuff" }, fields: { source: "some-source" } } }
        ]
      }
    }
  }),
  Link: jest.fn().mockImplementation(
    // these props are invalid for an `a` tag
    ({
      activeClassName,
      activeStyle,
      getProps,
      innerRef,
      partiallyActive,
      ref,
      replace,
      to,
      ...rest
    }) =>
      React.createElement("a", {
        ...rest,
        href: to
      })
  ),
  StaticQuery: jest.fn(),
  useStaticQuery: jest.fn()
};
