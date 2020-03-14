const path = require('path')
const dll = require('./shared/dll')
const merge = require('webpack-merge')

module.exports = function(overrideConfig = {}) {
  const cwd = process.cwd()
  const distDir = path.resolve(cwd, 'dist/web-component')
  const dllConfig = dll(distDir)
  const config = merge(dllConfig, overrideConfig)
  return config
}
