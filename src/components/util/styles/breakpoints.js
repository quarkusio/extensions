const size = {
  sm: "1024px", // for mobile screen
  m: "1450px"
}

export const device = {
  sm: `(max-width: ${size.sm})`,
  m: `(min-width:${size.sm}) and (max-width: ${size.m})`
}

