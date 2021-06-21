const path = require('path')
const chalk = require('chalk')
const shell = require('shelljs')
const { exists, remove, readJSON, writeJSON, write, mkdir, copy } = require('../../utils/file')
const { mergeConfigs } = require('../../utils/utils')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const webpack = require('webpack')
const { merge: mergeWebpackConfig } = require('webpack-merge')
const createBasicConfig = require('../../configs/shared/basic-config')
const {
  jsxLoaders,
  loadAsRequest,
  importAsEsSourceCode,
  changeBabelConfig,
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
const AfterHookPlugin = require('../../plugins/after-hook-webpack-plugin')
const { tsxLoaders } = require('../../configs/rules/tsx')

module.exports = function build(source, dev) {
  const cwd = process.cwd()
  const env = process.env.NODE_ENV
  const srcDir = path.resolve(cwd, 'src', source)
  const distDir = path.resolve(cwd, 'dist', source)
  const configDir = path.resolve(cwd, '.nautil')
  const indexFile = path.resolve(srcDir, 'index.js')
  const configFile = path.resolve(configDir, 'cli-config.json')
  const wxFile = path.resolve(srcDir, 'config.js')

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

  if (!wxFile) {
    console.error(chalk.red(`${wxFile} is not existing!`))
    shell.exit(1)
  }

  const startTime = Date.now()

  // like babelrc { env: test: { ... } }
  const settings = readJSON(configFile)
  const configs = mergeConfigs(settings, env)

  // clear files
  if (!dev || (configs.clear && exists(distDir))) {
    remove(distDir)
  }

  const basicConfig = createBasicConfig('wechat', configs, source)
  const index = path.resolve(srcDir, 'index.js')
  const entry = [index]
  const plugins = []
  const loaders = [
    jsxLoaders,
    cssLoaders,
    lessLoaders,
    sassLoaders,
    fileLoaders,
  ]

  importAsEsSourceCode()
  loadAsRequest('wechat')
  enableStylesheetSourceMap(false)

  unshiftStyesheetLoader(cssLoaders, MiniCssExtractPlugin.loader, cssModulesConfig, true)
  unshiftStyesheetLoader(lessLoaders, MiniCssExtractPlugin.loader, cssModulesConfig, true)
  unshiftStyesheetLoader(sassLoaders, MiniCssExtractPlugin.loader, cssModulesConfig, true)
  unshiftStyesheetLoader(cssLoaders, MiniCssExtractPlugin.loader)
  unshiftStyesheetLoader(lessLoaders, MiniCssExtractPlugin.loader)
  unshiftStyesheetLoader(sassLoaders, MiniCssExtractPlugin.loader)
  plugins.push(
    new MiniCssExtractPlugin({
      filename: `app.wxss`,
    })
  )

  // import() -> require()
  changeBabelConfig((babelConfig) => {
    babelConfig.plugins.push(path.resolve(__dirname, '../../plugins/babel-plugin-import-statement-to-require.js'))
  })

  // 生成所有所需的文件
  let created = false
  plugins.push(new AfterHookPlugin(() => {
    if (dev && created) {
      return
    }

    const wxConfigs = require(wxFile)(env)
    const { app, pages, project, sitemap } = wxConfigs

    writeJSON(path.resolve(distDir, 'sitemap.json'), sitemap)
    writeJSON(path.resolve(distDir, 'project.config.json'), project)

    pages.forEach((pagePath, i) => {
      if (pagePath[0] === '$') {
        const page = pagePath.substring(1)
        const pageDir = path.resolve(distDir, 'pages', page)
        mkdir(pageDir)
        write(path.resolve(pageDir, page + '.js'), `require('../../index.js').default(false);`)
        writeJSON(path.resolve(pageDir, page + '.json'), {
          usingComponents: {
            dynamic: '../../components/dynamic/dynamic',
          },
        })
        write(path.resolve(pageDir, page + '.wxml'), `<dynamic data="{{vdom}}"></dynamic>`)
        pages[i] = `pages/${page}/${page}`
      }
      else if (pagePath.indexOf('pages/') === -1) {
        const page = `pages/${pagePath}/${pagePath}`
        pages[i] = page
        if (exists(path.resolve(distDir, page))) {
          remove(path.resolve(distDir, page))
        }
        copy(path.resolve(srcDir, page), path.resolve(distDir, page))
      }

      created = true
    })

    app.pages = pages
    writeJSON(path.resolve(distDir, 'app.json'), app)
    write(path.resolve(distDir, 'app.js'), `require('./index.js').default(true)`)

    if (exists(path.resolve(distDir, 'components/dynamic'))) {
      remove(path.resolve(distDir, 'components/dynamic'))
    }
    mkdir(path.resolve(distDir, 'components'))
    copy(path.resolve(cwd, 'node_modules/nautil/miniprogram_dist/wechat/components/dynamic'), path.resolve(distDir, 'components/dynamic'), true)
    write(path.resolve(distDir, 'components/dynamic/dynamic.wxss'), `@import '../../app.wxss';`)
  }))

  if (configs.typescript) {
    loaders.push(tsxLoaders)
  }

  const customConfig = {
    entry,
    target: 'node',
    output: {
      path: distDir,
      filename: 'index.js',
      libraryTarget: 'commonjs2',
    },
    module: {
      rules: loaders,
    },
    plugins,
    optimization: {
      minimizer: env === 'production' ? [
        new OptimizeCSSAssetsPlugin({
          assetNameRegExp: /\.wxss$/g,
        }),
      ] : undefined,
    },
    devtool: false, // we do not need sourcemap
  }

  // hook config
  const { build: modifyBuildConfig, dev: modifyDevConfig } = decideby(() => {
    if (exists(path.resolve(configDir, 'wechat.js'))) {
      return require(path.resolve(configDir, 'wechat.js'))
    }
    else {
      return {}
    }
  })

  const create = () => {
    let config = mergeWebpackConfig(basicConfig, customConfig)

    if (configs.cache || dev) {
      cache(config, source, dev)
    }

    if (modifyBuildConfig && !dev) {
      config = modifyBuildConfig(config)
    }

    if (modifyDevConfig && dev) {
      config = modifyDevConfig(config)
    }

    if (configs.analyer) {
      config = analysis(config, source)
    }

    const compiler = webpack(config)

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

    return {
      build: () => compiler.run((err, stats) => {
        fallIntoError(err, stats)
        const endTime = Date.now()
        const duration = endTime - startTime
        console.log('Cost time(ms):', duration)
        shell.exit(0)
      }),
      watch: () => compiler.watch({
        ignored: /node_modules/,
      }, (err, stats) => {
        fallIntoError(err, stats)
        const { startTime, endTime } = stats
        console.log(chalk.bold.green('Compiled! Cost ' + (endTime - startTime)))
      }),
    }
  }

  return create()
}
