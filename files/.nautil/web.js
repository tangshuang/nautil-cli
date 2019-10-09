const config = require('nautil-cli/configs/web')
const devServer = require('./dev-server.config')
const merge = require('webpack-merge')

module.exports = merge(config, {
  devServer,
})
