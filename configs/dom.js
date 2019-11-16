const path = require('path')

const merge = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlPlugin = require('html-webpack-plugin')
const { HotModuleReplacementPlugin } = require('webpack')
const ModuleModifyPlugin = require('../plugins/module-modify-webpack-plugin')

const basicConfig = require('./basic.config')
const { jsxLoader, babelConfig } = require('./rules/jsx')
const { cssLoader, lessLoader, sassLoader } = require('./rules/style')
const { fileLoader } = require('./rules/file')

const env = process.env.NODE_ENV
const cwd = process.cwd()
const srcDir = path.resolve(cwd, 'src/dom')
const distDir = path.resolve(cwd, 'dist/dom')

// find out dependencies
const getPackageDependencies = (name, dependencies = {}) => {
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
const nautilDeps = getPackageDependencies('nautil')
const reactDeps = getPackageDependencies('react')

// unshiftLoader
const unshiftCssLoader = (cssLoaderConfig, loader) => {
  cssLoaderConfig.oneOf.forEach((item) => {
    item.use.unshift(loader)
  })
}

const entry = [
  path.resolve(srcDir, 'index.js'),
]
const plugins = [
  new HtmlPlugin({
    template: path.resolve(srcDir, 'index.html'),
    filename: path.resolve(distDir, 'index.html'),
  }),
]

const customConfig = {
  target: 'web',
  entry,
  output: {
    path: distDir,
    filename: '[name].[hash].js',
    chunkFilename: '[id].[hash].js',
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
  plugins,
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
            if (pkg.indexOf('react') === 0 || reactDeps[pkg] || pkg === 'scheduler') {
              return `react-vendors`
            }
            else if (nautilDeps[pkg]) {
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

// hot reload
if (env === 'development' && !process.env.NO_HOT_RELOAD) {
  babelConfig.plugins.push('react-hot-loader/babel')
  entry.unshift('react-hot-loader/patch')
  plugins.push(new HotModuleReplacementPlugin())
  unshiftCssLoader(cssLoader, 'style-loader')
  unshiftCssLoader(lessLoader, 'style-loader')
  unshiftCssLoader(sassLoader, 'style-loader')

  customConfig.devServer = {
    hot: true,
    liveReload: false,
  }

  const hotCode = [
    '\n',
    'if (module.hot) {',
    '  module.hot.accept()',
    '}',
  ].join('\n')
  plugins.push(
    new ModuleModifyPlugin(
      (request) => {
        if (!request) {
          return false
        }
        if (request.indexOf(srcDir) !== 0) {
          return false
        }
        if (entry.indexOf(request) === -1) {
          return false
        }
        return true
      },
      content => content + hotCode
    )
  )
}
// not hot reload
else {
  unshiftCssLoader(cssLoader, MiniCssExtractPlugin.loader)
  unshiftCssLoader(lessLoader, MiniCssExtractPlugin.loader)
  unshiftCssLoader(sassLoader, MiniCssExtractPlugin.loader)
  plugins.push(
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css',
      chunkFilename: '[id].[hash].css',
    })
  )
}

const config = merge(basicConfig, customConfig)

module.exports = config
