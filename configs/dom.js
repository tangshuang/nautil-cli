const path = require('path')
const merge = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlPlugin = require('html-webpack-plugin')
const { HotModuleReplacementPlugin } = require('webpack')
const ModuleModifyPlugin = require('../plugins/module-modify-webpack-plugin')

const basicConfig = require('./shared/basic-config')
const splitChunksConfig = require('./shared/split-chunks')

const { jsxLoaders, babelConfig } = require('./rules/jsx')
const { cssLoaders, lessLoaders, sassLoaders, unshiftStyesheetLoader } = require('./rules/style')
const { fileLoaders } = require('./rules/file')

const env = process.env.NODE_ENV
const cwd = process.cwd()
const srcDir = path.resolve(cwd, 'src/dom')
const distDir = path.resolve(cwd, 'dist/dom')

const entry = [
  path.resolve(srcDir, 'index.js'),
]
const plugins = [
  new HtmlPlugin({
    template: path.resolve(srcDir, 'index.html'),
    filename: path.resolve(distDir, 'index.html'),
  }),
]

const customConfig = {
  target: 'web',
  entry,
  output: {
    path: distDir,
    filename: '[name].[contenthash].js',
    chunkFilename: '[id].[contenthash].js',
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
}

// hot reload
if (env === 'development' && !process.env.NO_HOT_RELOAD) {
  babelConfig.plugins.push('react-hot-loader/babel')
  entry.unshift('react-hot-loader/patch')
  unshiftStyesheetLoader(cssLoaders, 'style-loader')
  unshiftStyesheetLoader(lessLoaders, 'style-loader')
  unshiftStyesheetLoader(sassLoaders, 'style-loader')

  customConfig.devServer = {
    hot: true,
    liveReload: false,
  }

  const hotCode = [
    '\n',
    'if (module.hot) {',
    '  module.hot.accept()',
    '}',
  ].join('\n')
  plugins.push(new HotModuleReplacementPlugin())
  plugins.push(
    new ModuleModifyPlugin(
      (request) => {
        if (!request) {
          return false
        }
        if (request.indexOf(srcDir) !== 0) {
          return false
        }
        if (entry.indexOf(request) === -1) {
          return false
        }
        return true
      },
      content => content + hotCode
    )
  )
}
// not hot reload
else {
  unshiftStyesheetLoader(cssLoaders, MiniCssExtractPlugin.loader)
  unshiftStyesheetLoader(lessLoaders, MiniCssExtractPlugin.loader)
  unshiftStyesheetLoader(sassLoaders, MiniCssExtractPlugin.loader)
  plugins.push(
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css',
    })
  )
}

const config = merge(basicConfig, splitChunksConfig, customConfig)

module.exports = config
