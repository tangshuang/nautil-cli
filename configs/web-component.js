const merge = require('webpack-merge')
const path = require('path')
const HtmlPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const WebComponentCssPlugin = require('../plugins/web-component-css-webpack-plugin')

const basicConfig = require('./basic.config')
const { fileLoaderConfig } = require('./rules/file')
const domConfig = require('./dom')
const { jsxLoader } = require('./rules/jsx')
const { cssLoader, lessLoader, sassLoader } = require('./rules/style')
const { fileLoader } = require('./rules/file')

const cwd = process.cwd()
const srcDir = path.resolve(cwd, 'src/web-component')
const distDir = path.resolve(cwd, 'dist/web-component')

// all files should be convert to be base64
fileLoaderConfig.limit = 1000000000

const customConfig = {
  target: 'web',
  entry: [
    path.resolve(srcDir, 'index.js'),
  ],
  output: {
    path: distDir,
    filename: '[name].[hash].js',
    chunkFilename: '[id].[hash].js',
  },
  module: {
    rules: [
      jsxLoader,
      cssLoader,
      lessLoader,
      sassLoader,
      fileLoader,
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css',
      chunkFilename: '[id].[hash].css',
    }),
    new WebComponentCssPlugin(),
  ],

  // notice: users of the web component should import all files
  optimization: domConfig.optimization,
}

if (process.env.NODE_ENV !== 'production') {
  customConfig.plugins.push(new HtmlPlugin({
    template: path.resolve(srcDir, 'index.html'),
    filename: path.resolve(distDir, 'index.html'),
  }))
}

const config = merge(basicConfig, customConfig)

module.exports = config
