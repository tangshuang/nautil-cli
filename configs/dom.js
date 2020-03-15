const path = require('path')
const merge = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlPlugin = require('html-webpack-plugin')
const { HotModuleReplacementPlugin } = require('webpack')
const ModuleModifyPlugin = require('../plugins/module-modify-webpack-plugin')
const DllReferencePlugin = require('webpack/lib/DllReferencePlugin')
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin')

const basicConfig = require('./shared/basic-config')
const splitChunksConfig = require('./shared/split-chunks')

const { jsxLoaders } = require('./rules/jsx')
const { cssLoaders, lessLoaders, sassLoaders, unshiftStyesheetLoader } = require('./rules/style')
const { fileLoaders } = require('./rules/file')

module.exports = function(overrideConfig = {}) {
  const env = process.env.NODE_ENV
  const cwd = process.cwd()
  const srcDir = path.resolve(cwd, 'src/dom')
  const distDir = path.resolve(cwd, 'dist/dom')

  const entry = [
    path.resolve(srcDir, 'index.js'),
  ]
  const plugins = [
    new HtmlPlugin({
      template: path.resolve(srcDir, 'index.html'),
      filename: path.resolve(distDir, 'index.html'),
    }),
  ]

  const HASH = env === 'development' ? 'hash' : 'contenthash'

  const customConfig = {
    target: 'web',
    entry,
    output: {
      path: distDir,
      filename: `[name].[${HASH}].js`,
      chunkFilename: `[id].[${HASH}].js`,
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
    plugins,
  }

  // hot reload
  if (env === 'development' && process.env.HOT_RELOAD) {
    // TODO: react-hot-loader seems not working in nautil-cli, we are waiting for a more helpful tool
    // babelConfig.plugins.push('react-hot-loader/babel')
    // entry.unshift('react-hot-loader/patch')
    unshiftStyesheetLoader(cssLoaders, 'style-loader')
    unshiftStyesheetLoader(lessLoaders, 'style-loader')
    unshiftStyesheetLoader(sassLoaders, 'style-loader')

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
    plugins.push(new HotModuleReplacementPlugin())
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
    unshiftStyesheetLoader(cssLoaders, MiniCssExtractPlugin.loader)
    unshiftStyesheetLoader(lessLoaders, MiniCssExtractPlugin.loader)
    unshiftStyesheetLoader(sassLoaders, MiniCssExtractPlugin.loader)
    plugins.push(
      new MiniCssExtractPlugin({
        filename: `[name].[${HASH}].css`,
        chunkFilename: `[id].[${HASH}].css`,
      })
    )
  }

  let splitConfig = splitChunksConfig
  // DllReferencePlugin will read the manifest file at the moment,
  // so we shoul not new the plugin in processing
  if (process.env.DLL) {
    splitConfig = {
      plugins: [
        new DllReferencePlugin({
          manifest: require(path.resolve(distDir, 'react.manifest.json')),
        }),
        new DllReferencePlugin({
          manifest: require(path.resolve(distDir, 'nautil.manifest.json')),
        }),
        new AddAssetHtmlPlugin({
          filepath: path.resolve(distDir, '*.dll.js'),
        }),
      ],
    }
  }

  const config = merge(basicConfig, splitConfig, customConfig)
  const outputConfig = merge(config, overrideConfig)

  return outputConfig
}
