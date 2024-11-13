import * as React from "react"
import { getPalette } from "../util/styles/style"
import { LabelList, Legend, Pie, PieChart, ResponsiveContainer, Text, Tooltip } from "recharts"
import PropTypes from "prop-types"
import styled from "styled-components"
import { useMediaQuery } from "react-responsive"
import { device } from "../util/styles/breakpoints"

const RADIAN = Math.PI / 180

const bigHeight = "520px"
const mediumHeight = "340px"
const smallHeight = "260px"

//  We need to set an explicit height for the charts, or the contents don't render at all
const ChartHolder = styled.div`
  height: ${bigHeight};

  // noinspection CssUnknownProperty
  @media ${device.sm} {
    height: ${mediumHeight};
  }

  // noinspection CssUnknownProperty
  @media ${device.xs} {
    height: ${smallHeight};
  }
`

const LegendHolder = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const LegendSwatch = styled.div`
  height: var(--font-size-10);
  width: var(--font-size-10);
  border-radius: 3px;
  background-color: ${(props) => props.color};
  border: 0.5px lightgray solid;
`

const ContributorList = styled.ul`
  overflow: scroll;
  background-color: var(--main-background-color); // this very slightly reduces quite how awful it is if the content overflows to the right-hand side
  padding-inline-start: 0;

  height: calc(${bigHeight} - var(--a-generous-space));

  // noinspection CssUnknownProperty
  @media ${device.sm} {
    height: auto;
  }
`

const ContributorInformation = styled.li`
  list-style-type: none;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  color: var(--main-text-color);
  column-gap: 0.75rem;
  font-size: var(--font-size-10);
  padding: 2px;
  max-width: 200px;
`

const Contributor = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  column-gap: 0.25rem;

  &:link {
    color: var(--main-text-color);
    text-decoration: underline;
  }

  &:visited {
    color: var(--main-text-color);
    text-decoration: underline;
  }
`

// For an easy life, sort companies alphabetically
const companyComparator = (a, b) => {
  return a?.localeCompare(b)
}

const ContributionsChart = (props) => {
  const uncolouredContributors = props.contributors
  const uncolouredCompanies = props.companies

  const isMobile = useMediaQuery({ query: device.xs })
  const isSmallScreen = useMediaQuery({ query: device.sm })

  if (uncolouredContributors?.length > 0) {
    const palette = getPalette(uncolouredContributors.length, props.baseColour)

    let companies

    if (uncolouredCompanies?.length > 0) {
      const companyPalette = getPalette(uncolouredCompanies.length, props.companyColour)
      companies = uncolouredCompanies.sort((a, b) => b.contributions - a.contributions).map((contributor, i) => {
        return { ...contributor, fill: companyPalette[i] }
      })
      // Now that we have a palette based on contributions, sort again to be alphabetical
      companies = companies.sort((a, b) => companyComparator(a.name, b.name))
    }

    const ungroupedContributors = uncolouredContributors.sort((a, b) => b.contributions - a.contributions).map((contributor, i) => {
      return { ...contributor, fill: palette[i] }
    })

    const contributors = ungroupedContributors.sort((a, b) => a.company === b.company ? (b.contributions - a.contributions) : companyComparator(a.company, b.company))

    const lotsOfContributors = contributors.length > 8
    const shouldRenderLabels = !lotsOfContributors && !isSmallScreen
    const shouldRenderExternalLegend = isSmallScreen

    // These have to be convincingly smaller than the size of the chartholder, or a ring will go missing
    const innerRadius = isMobile ? 40 : 70
    const companyRingWidth = isMobile ? 15 : 25

    const width = "100%"

    //  we set a blank label if there are a small number of contributors, so we get the line, but we define our own
    // text so we can make it black. the offset in the label list is hand-tuned to put the text near the end of the line
    return (
      <div width={width}>
        <ChartHolder>

          <ResponsiveContainer width={width} height="100%">
            <PieChart title={"Committers"}
                      desc={`A pie chart showing that ${contributors[0].name} has made the most commits in the past six months.`}>
              <Pie data={companies} dataKey="contributions" nameKey="name" innerRadius={innerRadius}
                   outerRadius={innerRadius + companyRingWidth}
              >
              </Pie>

              <Pie data={contributors} dataKey="contributions" nameKey="name"
                   innerRadius={innerRadius + companyRingWidth + 5}
                   label={shouldRenderLabels ? () => "" : false}
              >

                {shouldRenderLabels &&
                  <LabelList position="outside" offset={21} stroke="none"
                             fill="var(--main-text-color)"
                             content={renderCustomizedLabel} valueAccessor={(p) => p} />}
                }
              </Pie>

              {(shouldRenderExternalLegend) || <Legend layout="vertical" align="right" verticalAlign="top"
                                                       content={renderLegend} />}

              <Tooltip formatter={((value, name) => [`${value} commits`, name])} />

            </PieChart>
          </ResponsiveContainer>
        </ChartHolder>
        {shouldRenderExternalLegend &&
          renderLegend({
            payload: contributors.map(entry => {
              return { payload: { ...entry, value: entry.contributions } }
            })
          })

        }
      </div>)


  }
}


// Render a customised label so we can add in a link
const renderCustomizedLabel = (props) => {
  const { cx, cy, offset, value, stroke, viewBox } = props
  const { startAngle, endAngle, outerRadius } = viewBox

  const midAngle = (startAngle + endAngle) / 2
  const { x, y } = polarToCartesian(cx, cy, outerRadius + offset, midAngle)

  const anchor = getTextAnchor(x, cx)

  // If this is undefined, we just won't show a link, which is fine
  const profileUrl = value.url

  return (
    <g>
      <a href={profileUrl}>
        <Text offset={offset} stroke={stroke} cx={cx} cy={cy} x={x}
              y={y} fill="var(--main-text-color)" textAnchor={anchor}
              verticalAnchor="middle"
              className="recharts-pie-label-text"
        >
          {value.name}
        </Text>
      </a>
    </g>
  )
}

const renderLegend = (props) => {
  const { payload } = props

  return (
    <LegendHolder>
      <h5>Commits</h5>
      <ContributorList>
        {
          payload.filter(entry => entry.payload.login) // Filter out companies from the list, by assuming they won't have a login field
            .sort((a, b) =>
              b.payload.contributions - a.payload.contributions
            ).map((entry, index) => {
            const { payload: { name, value, fill } } = entry

            return (
              <ContributorInformation key={`item-${index}`}>
                <Contributor>
                  <LegendSwatch color={fill} />
                  <a href={entry?.payload.url}>{name}</a>
                </Contributor>
                <span
                  style={{
                    "textAlign": "right"
                  }}>{value}</span>
              </ContributorInformation>
            )
          })
        }
      </ContributorList>
    </LegendHolder>
  )
}

// Copied from https://github.com/recharts/recharts/blob/f7410319bd65752b392e6767e7b5c7aaaaf9cc6a/src/polar/Pie.tsx#L402
const getTextAnchor = (x, cx) => {
  if (x > cx) {
    return "start"
  }
  if (x < cx) {
    return "end"
  }

  return "middle"
}

// Copied from https://github.com/recharts/recharts/blob/master/src/util/PolarUtils.ts#L12
const polarToCartesian = (cx, cy, radius, angle) => ({
  x: cx + Math.cos(-RADIAN * angle) * radius,
  y: cy + Math.sin(-RADIAN * angle) * radius,
})

ContributionsChart.propTypes = { data: PropTypes.shape({ contributions: PropTypes.number, name: PropTypes.string }) }

export default ContributionsChart