const merge = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
const nodeExternals = require('webpack-node-externals')
const FilesFilterPlugin = require('../plugins/files-filter-webpack-plugin')

const basicConfig = require('./shared/basic-config')

const { jsxLoaders } = require('./rules/jsx')
const { cssLoaders, lessLoaders, sassLoaders, unshiftStyesheetLoader } = require('./rules/style')
const { fileLoaders } = require('./rules/file')

const cwd = process.cwd()
const srcDir = path.resolve(cwd, 'src/ssr')
const distDir = path.resolve(cwd, 'dist/ssr')

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
  entry: [
    path.resolve(srcDir, 'server.js'),
  ],
  output: {
    path: distDir,
    filename: 'server.js',
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
    new FilesFilterPlugin(function(file) {
      const { options } = this
      const { output } = options
      return file.indexOf(output.filename) !== 0
    }),
  ],
  externals,
}

unshiftStyesheetLoader(cssLoaders, MiniCssExtractPlugin.loader)
unshiftStyesheetLoader(lessLoaders, MiniCssExtractPlugin.loader)
unshiftStyesheetLoader(sassLoaders, MiniCssExtractPlugin.loader)

const config = merge(basicConfig, customConfig)

module.exports = config
