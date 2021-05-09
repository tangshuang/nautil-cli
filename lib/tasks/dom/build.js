const path = require('path')
const chalk = require('chalk')
const shell = require('shelljs')
const { exists, remove, readJSON } = require('../../utils/file')
const { mergeConfigs } = require('../../utils/utils')

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
const ModuleModifyPlugin = require('../../plugins/module-modify-webpack-plugin')

module.exports = function build(callback) {
  const cwd = process.cwd()
  const env = process.env.NODE_ENV
  const srcDir = path.resolve(cwd, 'src/dom')
  const distDir = path.resolve(cwd, 'dist/dom')
  const configDir = path.resolve(cwd, '.nautil')
  const indexFile = path.resolve(srcDir, 'index.js')
  const configFile = path.resolve(configDir, 'cli-config.json')

  if (!exists(configFile)) {
    console.log(chalk.red(`${configFile} is not existing!`))
    shell.exit(1)
  }

  // like babelrc { env: test: { ... } }
  const settings = readJSON(configFile)
  const configs = mergeConfigs(settings, env)

  const basicConfig = createBasicConfig('dom', configs)

  if (!exists(srcDir)) {
    console.log(chalk.red(`${srcDir} is not existing!`))
    shell.exit(1)
  }

  if (!exists(indexFile)) {
    console.log(chalk.red(`${indexFile} is not existing!`))
    shell.exit(1)
  }

  if (exists(distDir) && configs.clear) {
    remove(distDir)
  }

  const index = path.resolve(srcDir, 'index.js')
  const entry = [index]
  const plugins = [
    new HtmlPlugin({
      template: path.resolve(srcDir, 'index.html'),
      filename: path.resolve(distDir, 'index.html'),
    }),
    // make polyfill work
    new ModuleModifyPlugin(
      request => request === index,
      content => 'import "core-js";\nimport "regenerator-runtime/runtime";\n' + content,
    ),
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

  unshiftStyesheetLoader(cssLoaders, MiniCssExtractPlugin.loader, cssModulesConfig, true)
  unshiftStyesheetLoader(lessLoaders, MiniCssExtractPlugin.loader, cssModulesConfig, true)
  unshiftStyesheetLoader(sassLoaders, MiniCssExtractPlugin.loader, cssModulesConfig, true)
  unshiftStyesheetLoader(cssLoaders, MiniCssExtractPlugin.loader)
  unshiftStyesheetLoader(lessLoaders, MiniCssExtractPlugin.loader)
  unshiftStyesheetLoader(sassLoaders, MiniCssExtractPlugin.loader)
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
