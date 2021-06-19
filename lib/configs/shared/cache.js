const path = require('path')

module.exports = function(config, source, dev) {
  const cwd = process.cwd()

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
