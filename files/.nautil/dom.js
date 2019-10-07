const basicConfig = require('./basic.config')
const merge = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
const HtmlPlugin = require('html-webpack-plugin')
const babelLoaderConfig = require('./babel-loader.config')
const { Ty, enumerate, ifexist, dict, list, Any } = require('tyshemo')

const cwd = process.cwd()

const cssLoaderConfig = {
  loader: 'css-loader',
  options: {
    modules: true,
    localsConvention: 'camelCaseOnly',
  },
}

module.exports = function dom(inputOptions = {}) {
  Ty.expect(inputOptions).to.be({
    entry: String,
    output: String,
    env: enumerate(['development', 'production']),
    html: ifexist(dict({
      entry: String,
      output: String,
    })),
    loaders: ifexist(list([
      dict({
        test: Any,
      }),
    ])),
    plugins: ifexist(Array),
    devServer: ifexist(Object),
  })

  const defaultOptions = {
    entry: path.resolve(cwd, 'src/index.js'),
    output: path.resolve(cwd, 'dist/index.js'),
    env: 'development',
  }
  const options = {
    ...defaultOptions,
    ...inputOptions,
  }

  const jsLoaders = [
    babelLoaderConfig,
  ]
  const cssLoaders = [
    { loader: 'style-loader' },
    cssLoaderConfig,
  ]
  const plugins = []
  const loaders = []
  const devServer = {}

  if (options.env === 'production') {
    cssLoaders[0] = MiniCssExtractPlugin.loader
    plugins.push(new MiniCssExtractPlugin())
  }

  if (options.html) {
    plugins.push(new HtmlPlugin({
      template: options.html.entry,
      filename: options.html.output,
    }))
  }

  if (options.loaders) {
    loaders.push(...options.loaders)
  }

  if (options.plugins) {
    plugins.push(...options.plugins)
  }

  if (options.devServer) {
    Object.assign(devServer, options.devServer)
  }

  const config = {
    target: 'web',
    mode: options.env === 'production' ? 'production' : 'none',
    entry: options.entry,
    output: {
      path: path.dirname(options.output),
      filename: path.filename(options.output),
    },
    module: {
      rules: [
        {
          test: /\.(jsx|js)$/,
          use: jsLoaders,
        },
        {
          test: /\.css$/,
          use: cssLoaders,
        },
        ...loaders,
      ],
    },
    plugins,
    devServer,
  }

  const outputConfig = merge(basicConfig, config)

  if (options.env === 'production') {
    outputConfig.devtool = undefined
    outputConfig.optimization.minimize = true
  }

  return outputConfig
}
