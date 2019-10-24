const merge = require('webpack-merge')
const HtmlPlugin = require('html-webpack-plugin')

const basicConfig = require('./web')
const path = require('path')

const rootDir = process.cwd()
const srcDir = path.resolve(rootDir, 'src/ssr')
const distDir = path.resolve(rootDir, 'dist/ssr')

const config = merge(basicConfig, {
  entry: path.resolve(srcDir, 'client.js'),
  output: {
    path: path.resolve(distDir, 'public'),
    publicPath: '/',
  },
  plugins: basicConfig.plugins.map((plugin) => {
    if (plugin instanceof HtmlPlugin) {
      return new HtmlPlugin({
        template: path.resolve(srcDir, 'index.html'),
        filename: path.resolve(distDir, 'index.html'),
      })
    }
    else {
      return plugin
    }
  }),
})

// disable webpack-dev-server
delete config.devServer

module.exports = config
