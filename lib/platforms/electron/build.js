const path = require('path')
const chalk = require('chalk')
const shell = require('shelljs')
const { exists, remove, readJSON, scandir, copy, writeJSON } = require('../../utils/file')
const { mergeConfigs } = require('../../utils/utils')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlPlugin = require('html-webpack-plugin')
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
const { fileLoaders } = require('../../configs/rules/file')
const { decideby } = require('ts-fns')
const cache = require('../../configs/shared/cache')
const analysis = require('../../configs/shared/analyzer')
const { tsxLoaders } = require('../../configs/rules/tsx')
const AfterHookPlugin = require('../../plugins/after-hook-webpack-plugin')
const { fallIntoError, createMainConfig } = require('./shared')

module.exports = function build(source) {
  const cwd = process.cwd()
  const env = process.env.NODE_ENV
  const srcDir = path.resolve(cwd, 'src', source)
  const distDir = path.resolve(cwd, 'dist', source)
  const configDir = path.resolve(cwd, '.nautil')
  const manifestDir = configDir
  const indexFile = path.resolve(srcDir, 'index.js')
  const configFile = path.resolve(configDir, 'cli-config.json')
  const electronFile = path.resolve(srcDir, 'config.json')
  const mainFile = path.resolve(srcDir, 'main.js')

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

  if (!exists(electronFile)) {
    console.error(chalk.red(`${electronFile} is not existing!`))
    shell.exit(1)
  }

  if (!exists(mainFile)) {
    console.error(chalk.red(`${mainFile} is not existing!`))
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

  const basicConfig = createBasicConfig('electron', configs, source)
  const index = path.resolve(srcDir, 'index.js')
  const entry = [index]
  const plugins = [
    new HtmlPlugin({
      template: path.resolve(srcDir, 'index.html'),
      filename: path.resolve(distDir, 'index.html'),
      inject: 'body',
    }),
  ]

  const HASH = env === 'development' ? 'hash' : 'contenthash'

  const loaders = [
    jsxLoaders,
    cssLoaders,
    lessLoaders,
    sassLoaders,
    fileLoaders,
  ]

  loadPolyfills({ corejs: true, index })
  loadAsRequest('dom')
  enableStylesheetSourceMap(configs.sourceMap)

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

  if (configs.typescript) {
    loaders.push(tsxLoaders)
  }

  // 生成所有所需的文件
  plugins.push(new AfterHookPlugin(() => {
    const { icon } = readJSON(electronFile)
    if (exists(path.resolve(distDir, icon))) {
      remove(path.resolve(distDir, icon))
    }
    copy(path.resolve(srcDir, icon), path.resolve(distDir, icon))

    if (exists(path.resolve(distDir, 'package.json'))) {
      remove(path.resolve(distDir, 'package.json'))
    }
    const { name } = readJSON(path.resolve(__dirname, '../../package.json'))
    writeJSON(path.resolve(distDir, 'package.json'), {
      name,
      main: 'main.js',
      build: {
        mac: {
          icon: `${icon}/icon.icns`,
        },
        win: {
          icon: `${icon}/icon.ico`,
        },
        linux: {
          icon,
        }
      },
    })
  }))

  const customConfig = {
    target: 'web',
    entry,
    output: {
      path: distDir,
      filename: `[name].[${HASH}].js`,
      chunkFilename: `[id].[${HASH}].js`,
      publicPath: '',
    },
    module: {
      rules: loaders,
    },
    plugins,
    optimization: {
      minimizer: env === 'production' ? [
        new OptimizeCSSAssetsPlugin({
          assetNameRegExp: /\.css$/g,
        }),
      ] : undefined,
    },
  }

  // hook config
  const { build: modifyBuildConfig, dll: modifyDllConfig } = decideby(() => {
    if (exists(path.resolve(configDir, 'electron.js'))) {
      return require(path.resolve(configDir, 'electron.js'))
    }
    else {
      return {}
    }
  })

  const buildBundle = (callback) => {
    const splitConfig = configs.dll ? dllref(manifestDir)
      : configs.chunks ? splitChunksConfig
      : {}

    let config = mergeWebpackConfig(basicConfig, customConfig, splitConfig)

    if (configs.cache) {
      cache(config, source, true)
    }

    if (modifyBuildConfig) {
      config = modifyBuildConfig(config, source)
    }

    if (configs.analyer) {
      config = analysis(config, source)
    }

    // main.js may require other files, so should build at last
    const mainBasicConfig = createBasicConfig('electron', configs, source)
    const mainConfig = mergeWebpackConfig(mainBasicConfig, createMainConfig(mainFile, distDir))

    webpack([config, mainConfig], (err, stats) => {
      fallIntoError(err, stats)
      const endTime = Date.now()
      const duration = endTime - startTime
      if (callback) {
        callback()
      }
      console.log('Compiled! Cost time(ms):', duration)
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
      dllConfig = modifyDllConfig(dllConfig, source)
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
