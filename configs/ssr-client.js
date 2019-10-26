const merge = require('webpack-merge')
const HtmlPlugin = require('html-webpack-plugin')

const basicConfig = require('./dom')
const path = require('path')

const rootDir = process.cwd()
const srcDir = path.resolve(rootDir, 'src/ssr')
const distDir = path.resolve(rootDir, 'dist/ssr')

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

module.exports = config
