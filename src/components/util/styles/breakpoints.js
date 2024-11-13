const size = {
  xs: "768px",
  sm: "1024px", // for mobile screen
  m: "1450px"
}

export const device = {
  xs: `screen and (max-width: ${size.xs})`,
  sm: `screen and (max-width: ${size.sm})`,
  m: `screen and (min-width:${size.sm}) and (max-width: ${size.m})`,
  l: `screen and (min-width:${size.sm})`

}

