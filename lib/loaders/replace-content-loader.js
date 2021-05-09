module.exports = function(content) {
  const { resourcePath } = this
  const options = this.getOptions()

  const { find, replace } = options

  if (find(resourcePath)) {
    const res = replace(content)
    return res
  }
  else {
    return content
  }
}
