const merge = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
const nodeExternals = require('webpack-node-externals')

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
      'nautil',
      'ts-fns',
      'storagex',
      'tyshemo',
      'rxjs',
      'ext',
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
  externals,
}

const config = merge(basicConfig, customConfig)

module.exports = config
