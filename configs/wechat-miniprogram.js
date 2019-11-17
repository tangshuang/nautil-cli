// https://github.com/wechat-miniprogram/kbone/blob/develop/docs/quickstart.md

const path = require('path')
const merge = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const MpPlugin = require('mp-webpack-plugin') // 用于构建小程序代码的 webpack 插件

const basicConfig = require('./shared/basic-config')
const mpConfig = require('./wechat-miniprogram.config')

const { jsxLoaders, babelConfig } = require('./rules/jsx')
const { cssLoaders, lessLoaders, sassLoaders, unshiftStyesheetLoader } = require('./rules/style')
const { fileLoaders } = require('./rules/file')

const cwd = process.cwd()
const srcDir = path.resolve(cwd, 'src/wechat-miniprogram')
const distDir = path.resolve(cwd, 'dist/wechat-miniprogram')

// do not support transform-runtime in wechat miniprogram
// add regenerator-runtime in entry
const babelPlugins = babelConfig.plugins
const babelRuntime = '@babel/plugin-transform-runtime'
babelPlugins.forEach((plugin, i) => {
  const name = Array.isArray(plugin) ? plugin[0] : plugin
  if (name === babelRuntime) {
    babelPlugins.splice(i, 1)
  }
})

const customConfig = {
  target: 'web', // 必需字段，不能修改
  entry: [
    'regenerator-runtime/runtime',
    path.resolve(srcDir, 'index.js'),
  ],
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
      jsxLoaders,
      cssLoaders,
      lessLoaders,
      sassLoaders,
      fileLoaders,
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

unshiftStyesheetLoader(cssLoaders, MiniCssExtractPlugin.loader)
unshiftStyesheetLoader(lessLoaders, MiniCssExtractPlugin.loader)
unshiftStyesheetLoader(sassLoaders, MiniCssExtractPlugin.loader)

const config = merge(basicConfig, customConfig)

module.exports = config
