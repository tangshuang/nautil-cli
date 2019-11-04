const merge = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
const nodeExternals = require('webpack-node-externals')
const FilesFilterPlugin = require('../plugins/files-filter-webpack-plugin')
const { exists } = require('../utils/file')

const basicConfig = require('./basic.config')
const { jsxLoader } = require('./rules/jsx')
const { cssLoader, lessLoader, sassLoader } = require('./rules/style')
const { fileLoader } = require('./rules/file')

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
  entry: path.resolve(srcDir, 'server.js'),
  output: {
    path: distDir,
    filename: 'server.js',
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

const config = merge(basicConfig, customConfig)

const hookFile = path.resolve(cwd, '.nautil/after.hook.js')
const hook = exists(hookFile) && require(hookFile)
const hookConfig = typeof hook === 'function' ? hook(config) : config

module.exports = hookConfig
