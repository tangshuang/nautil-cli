const path = require('path')
const chalk = require('chalk')
const shell = require('shelljs')
const { exists, remove, readJSON } = require('../../utils/file')
const { merge } = require('ts-fns')

const webpack = require('webpack')
const { merge: mergeWebpackConfig } = require('webpack-merge')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlPlugin = require('html-webpack-plugin')
const createBasicConfig = require('../../configs/shared/basic-config')
const splitChunksConfig = require('../../configs/shared/split-chunks')
const dllref = require('../../configs/shared/dll-refer')
const dll = require('../../configs/shared/dll')
const { jsxLoaders } = require('../../configs/rules/jsx')
const { cssModulesConfig, cssLoaders, lessLoaders, sassLoaders, unshiftStyesheetLoader } = require('../../configs/rules/style')
const { fileLoaders } = require('../../configs/rules/file')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

module.exports = function build(callback) {
  const cwd = process.cwd()
  const env = process.env.NODE_ENV
  const srcDir = path.resolve(cwd, 'src/dom')
  const distDir = path.resolve(cwd, 'dist/dom')
  const configDir = path.resolve(cwd, '.nautil')
  const indexFile = path.resolve(srcDir, 'index.js')

  // like babelrc { env: test: { ... } }
  const settings = readJSON(path.resolve(configDir, 'cli-config.json'))
  const configs = settings.env && settings.env[env] ? merge(settings, settings.env[env]) : settings

  const basicConfig = createBasicConfig('dom', configs)

  if (!exists(srcDir)) {
    console.log(chalk.red(`${srcDir} is not existing!`))
    shell.exit(1)
  }

  if (!exists(indexFile)) {
    console.log(chalk.red(`${indexFile} is not existing!`))
    shell.exit(1)
  }

  if (exists(distDir)) {
    remove(distDir)
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
    optimization: {
      minimizer: env === 'production' ? [
        new OptimizeCSSAssetsPlugin({
          assetNameRegExp: /\.(css|wxss)$/g,
        }),
      ] : undefined,
    },
  }

  unshiftStyesheetLoader(cssLoaders, MiniCssExtractPlugin.loader, cssModulesConfig)
  unshiftStyesheetLoader(lessLoaders, MiniCssExtractPlugin.loader, cssModulesConfig)
  unshiftStyesheetLoader(sassLoaders, MiniCssExtractPlugin.loader, cssModulesConfig)
  plugins.push(
    new MiniCssExtractPlugin({
      filename: `[name].[${HASH}].css`,
      chunkFilename: `[id].[${HASH}].css`,
    })
  )

  const splitConfig = configs.dll ? dllref(distDir)
    : configs.chunks ? splitChunksConfig
    : {}
  const config = mergeWebpackConfig(basicConfig, customConfig, splitConfig)
  const buildings = [config]

  if (configs.dll) {
    buildings.unshift(dll(distDir))
  }

  const compiler = webpack(buildings)
  compiler.run((err, stats) => {
    if (err) {
      console.error(err.stack || err)
      if (err.details) {
        console.error(err.details);
      }
      callback()
      return
    }

    if (stats.hasErrors()) {
      stats.toJson().errors.forEach((error) => {
        console.warn(chalk.yellow(error.message))
        console.warn(chalk.yellow(error.details))
      })
      callback()
      return
    }

    compiler.close((err) => {
      if (err) {
        throw err
      }

      callback()
    })
  })
}
