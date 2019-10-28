const merge = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
const nodeExternals = require('webpack-node-externals')
const FilterFilesPlugin = require('../filter-files-webpack-plugin')

const basicConfig = require('./basic.config')
const babelLoaderConfig = require('./babel-loader.config')
const cssLoaderConfig = require('./css-loader.config')

const rootDir = process.cwd()
const srcDir = path.resolve(rootDir, 'src/ssr')
const distDir = path.resolve(rootDir, 'dist/ssr')

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

const externals = [
  nodeExternals({
    whitelist: [
      /nautil/,
      'ts-fns',
      'storagex',
      'tyshemo',
      'rxjs',
      'ext',
      'i18next',
      'react-native',
      /\@babel\/runtime\/helpers\/esm/,
    ],
  }),
]

const customConfig = {
  target: 'node',
  entry: path.resolve(srcDir, 'server.js'),
  output: {
    path: distDir,
    filename: 'server.js',
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
  node: {
    console: false,
    global: false,
    process: false,
    __filename: false,
    __dirname: false,
    Buffer: false,
    setImmediate: false,
    dns: false,
    fs: false,
    path: false,
    url: false,
    setImmediate: false,
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css',
      chunkFilename: '[id].[hash].css',
    }),
    new FilterFilesPlugin({
      match(file, options) {
        const { output } = options
        return file.indexOf(output.filename) !== 0
      },
    }),
  ],
  externals,
}

const config = merge(basicConfig, customConfig)

module.exports = config
