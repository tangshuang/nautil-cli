const path = require('path')
const chalk = require('chalk')
const shell = require('shelljs')
const { exists, remove, readJSON, scandir, read } = require('../../utils/file')
const { mergeConfigs } = require('../../utils/utils')

const WebComponentCssPlugin = require('../../plugins/web-component-css-webpack-plugin')
const HtmlPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const webpack = require('webpack')
const { merge: mergeWebpackConfig } = require('webpack-merge')
const createBasicConfig = require('../../configs/shared/basic-config')
const splitChunksConfig = require('../../configs/shared/split-chunks')
const dllref = require('../../configs/shared/dll-refer')
const dll = require('../../configs/shared/dll')
const {
  jsxLoaders,
  loadAsRequest,
  loadPolyfills,
} = require('../../configs/rules/jsx')
const {
  cssModulesConfig,
  cssLoaders,
  lessLoaders,
  sassLoaders,
  unshiftStyesheetLoader,
  enableStylesheetSourceMap,
} = require('../../configs/rules/style')
const { fileLoaders, fileLoaderConfig } = require('../../configs/rules/file')
const { decideby } = require('ts-fns')

module.exports = function build() {
  const cwd = process.cwd()
  const env = process.env.NODE_ENV
  const srcDir = path.resolve(cwd, 'src/web-component')
  const distDir = path.resolve(cwd, 'dist/web-component')
  const configDir = path.resolve(cwd, '.nautil')
  const manifestDir = configDir
  const indexFile = path.resolve(srcDir, 'index.js')
  const configFile = path.resolve(configDir, 'cli-config.json')

  if (!exists(configFile)) {
    console.err(chalk.red(`${configFile} is not existing!`))
    shell.exit(1)
  }

  if (!exists(srcDir)) {
    console.error(chalk.red(`${srcDir} is not existing!`))
    shell.exit(1)
  }

  if (!exists(indexFile)) {
    console.error(chalk.red(`${indexFile} is not existing!`))
    shell.exit(1)
  }

  const startTime = Date.now()

  // like babelrc { env: test: { ... } }
  const settings = readJSON(configFile)
  const configs = mergeConfigs(settings, env)

  // clear files
  if (configs.clear && exists(distDir)) {
    if (configs.dll) {
      const files = scandir(distDir)
      files.forEach((file) => {
        if (!file.endsWith('.dll.js')) {
          remove(path.resolve(distDir, file))
        }
      })
    }
    else {
      remove(distDir)
    }
  }

  const basicConfig = createBasicConfig('web-component', configs)
  const index = path.resolve(srcDir, 'index.js')
  const entry = [index]

  const indexContent = read(index)
  const [, _placeholder] = indexContent.match(/define\(.*?,.*?,(.*?)\)/)
  const placeholder = _placeholder ? _placeholder.trim() : undefined

  const plugins = [
    new HtmlPlugin({
      template: path.resolve(srcDir, 'index.html'),
      filename: path.resolve(distDir, 'index.html'),
      inject: 'body',
    }),
    new WebComponentCssPlugin({
      placeholder,
    }),
  ]

  enableStylesheetSourceMap(false)
  loadPolyfills({ corejs: true, index })
  loadAsRequest('web-component')

  // all files should be convert to be base64
  fileLoaderConfig.limit = 1000000000

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

  // hook config
  const { build: modifyBuildConfig, dll: modifyDllConfig } = decideby(() => {
    if (exists(path.resolve(configDir, 'web-component.js'))) {
      return require(path.resolve(configDir, 'web-component.js'))
    }
    else {
      return {}
    }
  })

  const fallIntoError = (err, stats) => {
    if (err) {
      console.error(chalk.red(err.stack || err))
    }

    if (stats) {
      const info = stats.toJson()

      if (stats.hasErrors()) {
        info.errors.forEach((error) => {
          console.error(chalk.red(error.message))
        })
      }

      if (stats.hasWarnings()) {
        info.warnings.forEach((warning) => {
          console.error(chalk.yellow(warning.message))
        })
      }
    }

    if (err || (stats && stats.hasErrors())) {
      shell.exit(1)
    }
  }

  const buildBundle = (callback) => {
    const splitConfig = configs.dll ? dllref(manifestDir)
      : configs.chunks ? splitChunksConfig
      : {}
    let config = mergeWebpackConfig(basicConfig, customConfig, splitConfig)

    if (!configs.sourceMap) {
      config.devtool = undefined
    }

    if (modifyBuildConfig) {
      config = modifyBuildConfig(config)
    }

    webpack(config, (err, stats) => {
      fallIntoError(err, stats)
      const endTime = Date.now()
      const duration = endTime - startTime
      if (callback) {
        callback()
      }
      console.log('Cost time(ms):', duration)
      shell.exit(0)
    })
  }

  // build dll first
  if (
    configs.dll
    && !(
      exists(path.resolve(distDir, 'react.dll.js'))
      && exists(path.resolve(distDir, 'nautil.dll.js'))
      && exists(path.resolve(manifestDir, 'nautil.manifest.json'))
      && exists(path.resolve(manifestDir, 'react.manifest.json'))
    )
  ) {
    let dllConfig = dll(manifestDir, distDir, configs)
    if (modifyDllConfig) {
      dllConfig = modifyDllConfig(dllConfig)
    }
    const compiler = webpack(dllConfig)
    compiler.run((err, stats) => {
      fallIntoError(err, stats)
      buildBundle(() => {
        compiler.close((err) => {
          if(err) {
            throw err
          }
        })
      })
    })
  }
  else {
    buildBundle()
  }
}
