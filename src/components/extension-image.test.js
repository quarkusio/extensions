import { render, screen } from "@testing-library/react"
import React from "react"
import ExtensionImage from "./extension-image"

describe("the extension image", () => {
  describe("when no image is available", () => {
    const extension = {
      metadata: {},
    }

    beforeEach(() => {
      render(<ExtensionImage extension={extension} />)
    })

    it("renders a generic static image with suitable alt text", () => {
      const image = screen.getByAltText(
        "A generic image as a placeholder for the extension icon"
      )
      expect(image).toBeTruthy()
    })

    it("renders the placeholder image", () => {
      const image = screen.getByRole("img")
      expect(image.src).toContain("generic-extension-logo.png")
    })
  })

  describe("when there is an owner image", () => {
    const extension = {
      metadata: {
        sourceControl: {
          ownerImage: {
            childImageSharp: {
              gatsbyImageData: "owner-logo.png",
            },
          },
        },
      },
    }

    beforeEach(() => {
      render(<ExtensionImage extension={extension} />)
    })

    it("renders the owner image", () => {
      const image = screen.getByRole("img")
      expect(image.src).toContain("owner-logo.png")
    })
  })

  describe("when there is a social media preview", () => {
    const extension = {
      metadata: {
        sourceControl: {
          projectImage: {
            childImageSharp: {
              gatsbyImageData: "social-logo.png",
            },
          },
          ownerImage: {
            childImageSharp: {
              gatsbyImageData: "owner-logo.png",
            },
          },
        },
      },
    }

    beforeEach(() => {
      render(<ExtensionImage extension={extension} />)
    })

    it("renders the owner alt text", () => {
      const image = screen.getByAltText("The icon of the project")
      expect(image).toBeTruthy()
    })

    it("renders the owner image", () => {
      const image = screen.getByRole("img", {})

      expect(image.src).toContain("social-logo.png")
    })
  })

  describe("when the image is set in the metadata", () => {
    const extension = {
      metadata: {
        icon: {
          childImageSharp: {
            gatsbyImageData: "yaml-logo.png",
          },
        },
        sourceControl: {
          projectImage: {
            childImageSharp: {
              gatsbyImageData: "social-logo.png",
            },
          },
          ownerImage: {
            childImageSharp: {
              gatsbyImageData: "owner-logo.png",
            },
          },
        },
      },
    }

    beforeEach(() => {
      render(<ExtensionImage extension={extension} />)
    })

    it("renders the owner image", () => {
      const image = screen.getByRole("img", {})

      expect(image.src).toContain("yaml-logo.png")
    })
  })
})
