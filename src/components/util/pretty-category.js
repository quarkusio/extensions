const prettify = category => {
  const words = category.split(/[ -]/)
  return words
    .map(word => {
      return word[0].toUpperCase() + word.substring(1)
    })
    .join(" ")
}

export default prettify
