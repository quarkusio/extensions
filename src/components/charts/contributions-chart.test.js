import { render, screen } from "@testing-library/react"
import * as React from "react"
import ContributionsChart from "./contributions-chart"

describe("the contribution pie chart", () => {
    beforeEach(() => {

      render(
        <ContributionsChart
          contributors={[{ name: "Alice", contributions: 2 }]}
        />
      )
    })

    it("renders without error", async () => {
      // With the resizable container, we can't see inside the chart at all, sadly
    })

    it.skip("renders a committers chart", async () => {
      // The committers chart is an svg, not an image, but we can find it by title
      const chartTitle = screen.getByTitle("Committers")

      // ... but there's not much we can meaningfully test
      const chart = chartTitle.closest("svg")
      expect(chart).toBeTruthy()
    })
  }
)