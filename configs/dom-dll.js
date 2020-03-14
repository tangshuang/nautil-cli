const path = require('path')
const dll = require('./shared/dll')

module.exports = function(overrideConfig = {}) {
  const distDir = path.resolve(cwd, 'dist/dom')
  const dllConfig = dll(distDir)
  const config = merge(dllConfig, overrideConfig)
  return config
}
