// https://github.com/wechat-miniprogram/kbone/blob/develop/docs/quickstart.md

const path = require('path')
const merge = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const MpPlugin = require('mp-webpack-plugin') // 用于构建小程序代码的 webpack 插件
const { exists } = require('../utils/file')

const mpConfig = require('./wechat-mp.config')
const basicConfig = require('./basic.config')
const { jsxLoader } = require('./rules/jsx')
const { cssLoader, lessLoader, sassLoader } = require('./rules/style')
const { fileLoader } = require('./rules/file')

const cwd = process.cwd()
const srcDir = path.resolve(cwd, 'src/wechat-mp')
const distDir = path.resolve(cwd, 'dist/wechat-mp')

const customConfig = {
  target: 'web', // 必需字段，不能修改
  entry: path.resolve(srcDir, 'index.js'),
  output: {
    path: path.resolve(distDir, 'common'),
    filename: '[name].js',
    library: 'createApp', // 必需字段，不能修改
    libraryExport: 'default', // 必需字段，不能修改
    libraryTarget: 'window', // 必需字段，不能修改
  },
  optimization: {
    runtimeChunk: false, // 必需字段，不能修改
    splitChunks: { // 代码分割配置，不建议修改
      chunks: 'all',
      minSize: 1000,
      maxSize: 0,
      minChunks: 1,
      maxAsyncRequests: 100,
      maxInitialRequests: 100,
      automaticNameDelimiter: '-',
      name: true,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        }
      }
    },
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
      filename: '[name].wxss',
    }),
    new MpPlugin(mpConfig),
  ],
  devServer: {
    writeToDisk: true,
    hot: false,
    inline: false,
    liveReload: false,
  },
}

const config = merge(basicConfig, customConfig)

const hookFile = path.resolve(cwd, '.nautil/after.hook')
const hook = exists(hookFile) && require(hookFile)
const hookConfig = hook ? hook(config) : config

module.exports = hookConfig
