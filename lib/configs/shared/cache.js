const path = require('path')
const { babelConfig } = require('../rules/jsx')

module.exports = function(config, source, dev) {
  const cwd = process.cwd()

  Object.assign(babelConfig, {
    cacheCompression: false,
    cacheDirectory: true,
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
