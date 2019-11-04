const merge = require('webpack-merge')
const HtmlPlugin = require('html-webpack-plugin')
const path = require('path')
const { exists } = require('../utils/file')

const basicConfig = require('./dom')

const cwd = process.cwd()
const srcDir = path.resolve(cwd, 'src/ssr')
const distDir = path.resolve(cwd, 'dist/ssr')

const mergedConfig = merge(basicConfig, {
  entry: path.resolve(srcDir, 'client.js'),
  output: {
    path: path.resolve(distDir, 'public'),
    publicPath: '/',
  },
})

const config = {
  ...mergedConfig,
  plugins: mergedConfig.plugins.map((plugin) => {
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

  // disable webpack-dev-server
  devServer: undefined,
}

const hookFile = path.resolve(cwd, '.nautil/after.hook.js')
const hook = exists(hookFile) && require(hookFile)
const hookConfig = hook ? hook(config) : config

module.exports = hookConfig
