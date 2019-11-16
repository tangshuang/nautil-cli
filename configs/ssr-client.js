const merge = require('webpack-merge')
const path = require('path')
const { replaceHtmlConfig } = require('../utils/webpack-config')

const basicConfig = require('./dom')

const cwd = process.cwd()
const srcDir = path.resolve(cwd, 'src/ssr')
const distDir = path.resolve(cwd, 'dist/ssr')

const mergedConfig = merge(basicConfig, {
  entry: [
    path.resolve(srcDir, 'client.js'),
  ],
  output: {
    path: path.resolve(distDir, 'public'),
    publicPath: '/',
  },
})

replaceHtmlConfig(mergedConfig, (options) => {
  return {
    template: path.resolve(srcDir, 'index.html'),
    filename: path.resolve(distDir, 'index.html'),
  }
})

const config = {
  ...mergedConfig,

  // disable webpack-dev-server
  devServer: undefined,
}

module.exports = config
