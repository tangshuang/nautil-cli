const merge = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
const HtmlPlugin = require('html-webpack-plugin')

const basicConfig = require('./basic.config')
const babelLoaderConfig = require('./babel-loader.config')
const cssLoaderConfig = require('./css-loader.config')

const rootDir = process.cwd()
const srcDir = path.resolve(rootDir, 'src/web')
const distDir = path.resolve(rootDir, 'dist/web')

function getPackageDependencies(name, dependencies = {}) {
  try {
    const deps = require(name + '/package.json').dependencies
    if (!deps) {
      return dependencies
    }

    const keys = Object.keys(deps)
    keys.forEach((key) => {
      if (dependencies[key]) {
        return
      }
      dependencies[key] = true
      getPackageDependencies(key, dependencies)
    })
  }
  catch (e) {}

  dependencies[name] = true
  return dependencies
}

const deps = getPackageDependencies('nautil')

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
  target: 'web',
  entry: path.resolve(srcDir, 'index.js'),
  output: {
    path: distDir,
    filename: '[name].[hash].js',
    chunkFilename: '[id].[hash].js',
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
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css',
      chunkFilename: '[id].[hash].css',
    }),
    new HtmlPlugin({
      template: path.resolve(srcDir, 'index.html'),
      filename: path.resolve(distDir, 'index.html'),
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        vendors: {
          test: /node_modules/,
          name(module) {
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1]
            const [pkg, ver] = packageName.split('@')
            if (deps[pkg]) {
              return `nautil-vendors`
            }
            else {
              return `vendors`
            }
          },
          filename: '[name].[hash].js',
        },
        commons: {
          test(module) {
            return !/node_modules/.test(module.context)
          },
          name: 'main',
          filename: '[name].[hash].js',
        },
      },
    },
  },
}

const config = merge(basicConfig, customConfig)

module.exports = config
