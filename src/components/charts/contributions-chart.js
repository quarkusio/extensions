import * as React from "react"
import { getPalette } from "../util/styles/style"
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import PropTypes from "prop-types"


const ContributionsChart = (props) => {
  const uncolouredContributors = props.contributors

  if (uncolouredContributors) {
    const palette = getPalette(uncolouredContributors.length)

    const contributors = uncolouredContributors.sort((a, b) => b.contributions - a.contributions).map((contributor, i) => {
      return { ...contributor, fill: palette[i] }
    })
    
    return (
      <ResponsiveContainer width={700} height="80%">
        <PieChart title={"Committers"}
                  desc={`A pie chart showing that ${contributors[0].name} has made the most commits in the past six months.`}>
          <Pie data={contributors} dataKey="contributions" nameKey="name"
               label={contributors.length < 8 ? (contributor) => contributor.name : false}>
          </Pie>
          <Tooltip />

        </PieChart>
      </ResponsiveContainer>)
  }
}

ContributionsChart.propTypes = { data: PropTypes.shape({ contributions: PropTypes.number, name: PropTypes.string }) }

export default ContributionsChart