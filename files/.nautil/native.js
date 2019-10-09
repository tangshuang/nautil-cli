const config = require('nautil-cli/configs/native')
const devServer = require('./dev-server.config')
const merge = require('webpack-merge')

module.exports = merge(config, {
  devServer,
})
