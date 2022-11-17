const sortableName = name => {
  return name
    ?.toLowerCase()
    .replace("quarkus", "")
    .replace("-", "")
    .replace(/ /g, "")
}
module.exports = { sortableName }
