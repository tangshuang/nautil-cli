const create = require('./shared')
module.exports = function dev(source) {
  const { watch } = create(source)
  watch()
}
