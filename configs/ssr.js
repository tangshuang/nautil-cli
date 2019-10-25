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

class FilterFiles {
  apply(compiler) {
    compiler.hooks.emit.tap('FilterFilesPlugin', (compilation) => {
      const { options } = compilation
      const { output } = options
      compilation.chunks.forEach((chunk) => {
        chunk.files
        .filter(file => file.indexOf(output.filename) !== 0)
        .forEach(file => {
          delete compilation.assets[file]
        })
      })
    })
  }
}

const externals = [
  nodeExternals({
    whitelist: [
      /nautil/,
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
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css',
      chunkFilename: '[id].[hash].css',
    }),
    new FilterFiles(),
  ],
  externals,
}

const config = merge(basicConfig, customConfig)

module.exports = config
