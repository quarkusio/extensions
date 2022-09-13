import * as React from "react"
import { StaticImage } from "gatsby-plugin-image"
import { Link } from "gatsby"

const ExtensionCard = ({ extension }) => {
  const title = extension.frontmatter.title || extension.fields.slug

  return (
    <div
      className="extension-card"
      style={{ margin: "15px", width: "263px", height: "490px" }}
    >
      <StaticImage
        className="fake-content"
        layout="constrained"
        formats={["auto", "webp", "avif"]}
        src="../images/extension-card.png"
        alt="A dummy extension"
      />
      <article
        className="extension-list-item"
        itemScope
        itemType="http://schema.org/Article"
      >
        <header>
          <h2>
            <Link to={extension.fields.slug} itemProp="url">
              <span itemProp="headline">{title}</span>
            </Link>
          </h2>
          <small>{extension.frontmatter.date}</small>
        </header>
        <section>
          <p
            dangerouslySetInnerHTML={{
              __html: extension.frontmatter.description || extension.excerpt,
            }}
            itemProp="description"
          />
        </section>
      </article>
    </div>
  )
}

export default ExtensionCard
