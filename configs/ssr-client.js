const merge = require('webpack-merge')
const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlPlugin = require('html-webpack-plugin')

const basicConfig = require('./shared/basic-config')
const splitChunksConfig = require('./shared/split-chunks')

const { jsxLoaders } = require('./rules/jsx')
const { cssLoaders, lessLoaders, sassLoaders, unshiftStyesheetLoader } = require('./rules/style')
const { fileLoaders } = require('./rules/file')

const cwd = process.cwd()
const srcDir = path.resolve(cwd, 'src/ssr')
const distDir = path.resolve(cwd, 'dist/ssr')

const env = process.env.NODE_ENV
const HASH = env === 'development' ? 'hash' : 'contenthash'

const plugins = [
  new HtmlPlugin({
    template: path.resolve(srcDir, 'index.html'),
    filename: path.resolve(distDir, 'index.html'),
  }),
  new MiniCssExtractPlugin({
    filename: `[name].[${HASH}].css`,
    chunkFilename: `[id].[${HASH}].css`,
  }),
]

const customConfig = {
  target: 'web',
  entry: [
    path.resolve(srcDir, 'client.js'),
  ],
  output: {
    path: path.resolve(distDir, 'public'),
    publicPath: '/',
    filename: `[name].[${HASH}].js`,
    chunkFilename: `[id].[${HASH}].js`,
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
  plugins,
  // disable webpack-dev-server
  devServer: undefined,
}

unshiftStyesheetLoader(cssLoaders, MiniCssExtractPlugin.loader)
unshiftStyesheetLoader(lessLoaders, MiniCssExtractPlugin.loader)
unshiftStyesheetLoader(sassLoaders, MiniCssExtractPlugin.loader)

const config = merge(basicConfig, splitChunksConfig, customConfig)

module.exports = config
