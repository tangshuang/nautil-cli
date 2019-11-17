const merge = require('webpack-merge')
const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlPlugin = require('html-webpack-plugin')
const WebComponentCssPlugin = require('../plugins/web-component-css-webpack-plugin')
const { replaceHtmlConfig } = require('../utils/webpack-config')

const basicConfig = require('./shared/basic-config')
const splitChunksConfig = require('./shared/split-chunks')

const { fileLoaders, fileLoaderConfig } = require('./rules/file')
const { jsxLoaders } = require('./rules/jsx')
const { cssLoaders, lessLoaders, sassLoaders, unshiftStyesheetLoader } = require('./rules/style')

const cwd = process.cwd()
const srcDir = path.resolve(cwd, 'src/web-component')
const distDir = path.resolve(cwd, 'dist/web-component')

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
      jsxLoaders,
      cssLoaders,
      lessLoaders,
      sassLoaders,
      fileLoaders,
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css',
      chunkFilename: '[id].[hash].css',
    }),
    new WebComponentCssPlugin(),
    new HtmlPlugin({
      template: path.resolve(srcDir, 'index.html'),
      filename: path.resolve(distDir, 'index.html'),
    }),
  ],
}

// all files should be convert to be base64
fileLoaderConfig.limit = 1000000000
// use extract css loader
unshiftStyesheetLoader(cssLoaders, MiniCssExtractPlugin.loader)
unshiftStyesheetLoader(lessLoaders, MiniCssExtractPlugin.loader)
unshiftStyesheetLoader(sassLoaders, MiniCssExtractPlugin.loader)

const config = merge(basicConfig, splitChunksConfig, customConfig)

module.exports = config
