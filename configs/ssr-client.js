const merge = require('webpack-merge')
const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlPlugin = require('html-webpack-plugin')
const DllReferencePlugin = require('webpack/lib/DllReferencePlugin')
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin')

const basicConfig = require('./shared/basic-config')
const splitChunksConfig = require('./shared/split-chunks')

const { jsxLoaders } = require('./rules/jsx')
const { cssLoaders, lessLoaders, sassLoaders, unshiftStyesheetLoader } = require('./rules/style')
const { fileLoaders } = require('./rules/file')

module.exports = function(overrideConfig = {}) {
  const cwd = process.cwd()
  const srcDir = path.resolve(cwd, 'src/ssr')
  const distDir = path.resolve(cwd, 'dist/ssr')

  const env = process.env.NODE_ENV
  const HASH = env === 'development' ? 'hash' : 'contenthash'

  const plugins = [
    new HtmlPlugin({
      template: path.resolve(srcDir, 'index.html'),
      filename: path.resolve(distDir, 'index.html'),
    }),
    new MiniCssExtractPlugin({
      filename: `[name].[${HASH}].css`,
      chunkFilename: `[id].[${HASH}].css`,
    }),
  ]

  const customConfig = {
    target: 'web',
    entry: [
      path.resolve(srcDir, 'client.js'),
    ],
    output: {
      path: path.resolve(distDir, 'public'),
      publicPath: '/',
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
    // disable webpack-dev-server
    devServer: undefined,
  }

  unshiftStyesheetLoader(cssLoaders, MiniCssExtractPlugin.loader)
  unshiftStyesheetLoader(lessLoaders, MiniCssExtractPlugin.loader)
  unshiftStyesheetLoader(sassLoaders, MiniCssExtractPlugin.loader)

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
