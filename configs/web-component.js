const merge = require('webpack-merge')
const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlPlugin = require('html-webpack-plugin')
const WebComponentCssPlugin = require('../plugins/web-component-css-webpack-plugin')
const DllReferencePlugin = require('webpack/lib/DllReferencePlugin')

const basicConfig = require('./shared/basic-config')
const splitChunksConfig = require('./shared/split-chunks')

const { fileLoaders, fileLoaderConfig } = require('./rules/file')
const { jsxLoaders } = require('./rules/jsx')
const { cssLoaders, lessLoaders, sassLoaders, unshiftStyesheetLoader } = require('./rules/style')

module.exports = function(overrideConfig = {}) {
  const cwd = process.cwd()
  const srcDir = path.resolve(cwd, 'src/web-component')
  const distDir = path.resolve(cwd, 'dist/web-component')

  const env = process.env.NODE_ENV
  const HASH = env === 'development' ? 'hash' : 'contenthash'

  const customConfig = {
    target: 'web',
    entry: [
      path.resolve(srcDir, 'index.js'),
    ],
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
    plugins: [
      new MiniCssExtractPlugin({
        filename: `[name].[${HASH}].css`,
        chunkFilename: `[id].[${HASH}].css`,
      }),
      new WebComponentCssPlugin(),
      new HtmlPlugin({
        template: path.resolve(srcDir, 'index.html'),
        filename: path.resolve(distDir, 'index.html'),
      }),
    ],
  }

  // all files should be convert to be base64
  fileLoaderConfig.limit = 1000000000
  // use extract css loader
  unshiftStyesheetLoader(cssLoaders, MiniCssExtractPlugin.loader)
  unshiftStyesheetLoader(lessLoaders, MiniCssExtractPlugin.loader)
  unshiftStyesheetLoader(sassLoaders, MiniCssExtractPlugin.loader)

  const dllConfig = {
    plugins: [
      new DllReferencePlugin({
        manifest: require(path.resolve(distDir, 'react.manifest.json')),
      }),
      new DllReferenctPlugin({
        manifest: require(path.resolve(distDir, 'nautil.manifest.json')),
      }),
    ],
  }

  const splitConfig = process.env.DLL ? dllConfig : splitChunksConfig
  const config = merge(basicConfig, splitConfig, customConfig)
  const outputConfig = merge(config, overrideConfig)

  return outputConfig
}
