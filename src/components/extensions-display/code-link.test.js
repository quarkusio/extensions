import React from "react"
import { render, screen } from "@testing-library/react"
import CodeLink from "./code-link"

describe("try it out button", () => {
  describe("for typically platform extension", () => {
    beforeEach(() => {
      render(
        <CodeLink
          unlisted={false}
          artifact="io.quarkus:quarkus-elytron-security-common::jar:3.0.0.Alpha3"
          platforms={["quarkus-bom-quarkus-platform-descriptor"]}
          streams={[
            {
              platformKey: "io.quarkus.platform",
              id: "3.0",
              isLatestThree: true,
            },
          ]}
        />
      )
    })

    it("renders a button with a reasonable label", () => {
      expect(screen.getByText(/Try/)).toBeInTheDocument()
    })

    it("renders the correct link", () => {
      const link = screen.getByRole("link")
      expect(link).toBeTruthy()
      expect(link.href).toBe(
        "https://code.quarkus.io/?e=elytron-security-common&S=io.quarkus.platform%3A3.0"
      )
    })
  })

  describe("for unlisted extensions", () => {
    beforeEach(() => {
      render(
        <CodeLink
          unlisted={true}
          artifact={
            "io.quarkus:quarkus-elytron-security-common::jar:3.0.0.Alpha3"
          }
        />
      )
    })

    it("displays nothing", () => {
      expect(screen.queryByText(/Try/)).not.toBeInTheDocument()
    })
  })

  describe("for bad data", () => {
    beforeEach(() => {
      render(<CodeLink />)
    })

    it("gracefully displays nothing", () => {
      expect(screen.queryByText(/Try/)).not.toBeInTheDocument()
    })
  })
})
