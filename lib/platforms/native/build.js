const create = require('./shared')
module.exports = function build(source) {
  const { build } = create(source)
  build()
}
