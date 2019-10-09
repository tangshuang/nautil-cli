// https://github.com/wechat-miniprogram/kbone/blob/develop/docs/quickstart.md

const path = require('path')
const merge = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { DefinePlugin } = require('webpack')
const MpPlugin = require('../mp-webpack-plugin') // 用于构建小程序代码的 webpack 插件

const basicConfig = require('./basic.config')
const mpConfig = require('./mp.config')
const babelLoaderConfig = require('./babel-loader.config')
const cssLoaderConfig = require('./css-loader.config')

const rootDir = process.cwd()
const srcDir = path.resolve(rootDir, 'src/miniapp')
const distDir = path.resolve(rootDir, 'dist/miniapp')

const jsLoaders = [
  babelLoaderConfig,
]
const cssLoaders = [
  MiniCssExtractPlugin.loader,
  cssLoaderConfig,
]
const lessLoaders = [
  ...cssLoaders,
  'less-loader',
]

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
      {
        test: /\.(jsx|js)$/,
        include: babelLoaderConfig.options.include,
        use: jsLoaders,
      },
      {
        test: /\.css$/,
        use: cssLoaders,
      },
      {
        test: /\.less$/,
        use: lessLoaders,
      },
    ],
  },
  plugins: [
    new DefinePlugin({
      'process.env.APP_BASE_URL': JSON.stringify(process.env.WX_APP_BASE_URL),
    }),
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

module.exports = config
