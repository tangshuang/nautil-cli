const path = require('path')
const { changeBabelConfig } = require('../rules/jsx')

module.exports = function(config, source, dev) {
  const cwd = process.cwd()

  changeBabelConfig((babelConfig) => {
    Object.assign(babelConfig, {
      cacheCompression: false,
      cacheDirectory: true,
    })
  })

  if (dev) {
    config.cache = {
      type: 'memory',
    }
  }
  else {
    config.cache = {
      type: 'filesystem',
      cacheDirectory: path.resolve(cwd, '.build_cache', source, process.env.NODE_ENV),
      store: 'pack'
    }
  }
}
