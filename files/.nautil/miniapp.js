const config = require('nautil-cli/configs/miniapp')
const devServer = require('./dev-server.config')
const merge = require('webpack-merge')

module.exports = merge(config, {
  devServer,
})
