// https://github.com/wechat-miniprogram/kbone/blob/develop/docs/quickstart.md

const path = require('path')
const merge = require('webpack-merge')

const basicConfig = require('./basic.config')
const babelLoaderConfig = require('./babel-loader.config')

const rootDir = process.cwd()
const srcDir = path.resolve(rootDir, 'src/native')
const distDir = path.resolve(rootDir, 'src/react-native')

const jsLoaders = [
  babelLoaderConfig,
]
const cssLoaders = [
  'nautil-cli/css-object-loader',
]
const lessLoaders = [
  ...cssLoaders,
  'less-loader',
]

const customConfig = {
  target: 'web', // 必需字段，不能修改
  entry: path.resolve(srcDir, 'index.js'),
  output: {
    path: distDir,
    filename: 'index.js',
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
  devServer: {
    writeToDisk: true,
    hot: false,
    inline: false,
    liveReload: false,
  },
}

const config = merge(basicConfig, customConfig)

module.exports = config
