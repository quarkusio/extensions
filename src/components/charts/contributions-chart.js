import * as React from "react"
import { getPalette } from "../util/styles/style"
import { LabelList, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import PropTypes from "prop-types"


const ContributionsChart = (props) => {
  const uncolouredContributors = props.contributors

  if (uncolouredContributors) {
    const palette = getPalette(uncolouredContributors.length)

    const contributors = uncolouredContributors.sort((a, b) => b.contributions - a.contributions).map((contributor, i) => {
      return { ...contributor, fill: palette[i] }
    })

    const renderLegendText = (value, entry) => {
      const color = "black"

      const commitCount = entry?.payload?.value
      const commits = commitCount > 1 ? `${commitCount} commits` : commitCount === 1 ? `${commitCount} commit` : ""

      return <span><span style={{ color, display: "inline-block", width: "180px" }}>{value}</span><span
        style={{
          color, width: "100px",
          display: "inline-block",
          "text-align": "right"
        }}>{commits}</span></span>
    }

    const lotsOfContributors = contributors.length > 8

    //  we set a blank label if there are a small number of contributors, so we get the line, but we define our own
    // text so we can make it black. the offset in the label list is hand-tuned to put the text near the end of the line
    return (
      <ResponsiveContainer width={700} height="80%">
        <PieChart title={"Committers"}
                  desc={`A pie chart showing that ${contributors[0].name} has made the most commits in the past six months.`}>
          <Pie data={contributors} dataKey="contributions" nameKey="name" innerRadius={80}
               label={lotsOfContributors ? false : () => ""}
          >
            {lotsOfContributors ||
              <LabelList dataKey="name" position="outside" offset={21} stroke="none" fill="black" />}
          </Pie>
          {lotsOfContributors && <Legend layout="vertical" align="right" verticalAlign="top" iconType={"circle"}
                                         style={{ color: "black" }} formatter={renderLegendText} />}

          <Tooltip />

        </PieChart>
      </ResponsiveContainer>)
  }
}

ContributionsChart.propTypes = { data: PropTypes.shape({ contributions: PropTypes.number, name: PropTypes.string }) }

export default ContributionsChart