const merge = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
const HtmlPlugin = require('html-webpack-plugin')
const { HotModuleReplacementPlugin } = require('webpack')

const basicConfig = require('./basic.config')
const babelLoaderConfig = require('./babel-loader.config')
const cssLoaderConfig = require('./css-loader.config')

const rootDir = process.cwd()
const srcDir = path.resolve(rootDir, 'src/dom')
const distDir = path.resolve(rootDir, 'dist/dom')

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

const nautilDeps = getPackageDependencies('nautil')
const reactDeps = getPackageDependencies('react')

const jsLoaders = [
  babelLoaderConfig,
]
const cssLoaders = [
  cssLoaderConfig,
]
const lessLoaders = [
  ...cssLoaders,
  'less-loader',
]

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
if (process.env.NODE_ENV === 'development' && process.env.HOT_RELOAD) {
  entry.unshift('react-hot-loader/patch')
  entry.push(path.resolve(__dirname, '../polyfill/hot-entry.js'))
  plugins.push(new HotModuleReplacementPlugin())
  customConfig.devServer = {
    hot: true,
    inline: false,
    liveReload: false,
  }
  cssLoaders.unshift('style-loader')
  babelLoaderConfig.options.plugins.push('react-hot-loader/babel')
}
// not hot reload
else {
  cssLoaders.unshift(MiniCssExtractPlugin.loader)
  plugins.push(new MiniCssExtractPlugin({
    filename: '[name].[hash].css',
    chunkFilename: '[id].[hash].css',
  }))
}

const config = merge(basicConfig, customConfig)

module.exports = config
