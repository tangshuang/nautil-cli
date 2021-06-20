const path = require('path')
const chalk = require('chalk')
const shell = require('shelljs')
const { exists, remove, readJSON, writeJSON, write, mkdir, copy, read, append } = require('../../utils/file')
const { mergeConfigs, minifyCss } = require('../../utils/utils')
const { analysis } = require('../../utils/webpack-config')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const webpack = require('webpack')
const { merge: mergeWebpackConfig } = require('webpack-merge')
const createBasicConfig = require('../../configs/shared/basic-config')
const {
  jsxLoaders,
  loadAsRequest,
  importAsEsSourceCode,
  babelConfig,
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
const { decideby, each } = require('ts-fns')
const cache = require('../../configs/shared/cache')
const AfterHookPlugin = require('../../plugins/after-hook-webpack-plugin')

module.exports = function build(source) {
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
  if (configs.clear && exists(distDir)) {
    remove(distDir)
  }

  const basicConfig = createBasicConfig('wechat', configs, source)
  const index = path.resolve(srcDir, 'index.js')
  const entry = [index]

  importAsEsSourceCode()
  loadAsRequest('wechat')
  enableStylesheetSourceMap(false)

  const plugins = []
  const customConfig = {
    entry,
    target: 'node',
    output: {
      path: distDir,
      filename: 'index.js',
      libraryTarget: 'commonjs2',
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
          assetNameRegExp: /\.wxss$/g,
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
      filename: `app.wxss`,
    })
  )

  // import() -> require()
  babelConfig.plugins.push(path.resolve(__dirname, '../../plugins/babel-plugin-import-statement-to-require.js'))

  // hook config
  const { build: modifyBuildConfig } = decideby(() => {
    if (exists(path.resolve(configDir, 'wechat.js'))) {
      return require(path.resolve(configDir, 'wechat.js'))
    }
    else {
      return {}
    }
  })

  // 生成所有所需的文件
  plugins.push(new AfterHookPlugin(() => {
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
        pages[i] = `pages/${pagePath}/${pagePath}`
      }
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

    if (exists(path.resolve(srcDir, 'index.wxss'))) {
      const css = read(path.resolve(srcDir, 'index.wxss'))
      append(path.resolve(distDir, 'app.wxss'), minifyCss(css))
    }
  }))

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

  const create = () => {
    let config = mergeWebpackConfig(basicConfig, customConfig)

    if (configs.analyer) {
      config = analysis(config, source)
    }

    if (configs.cache) {
      cache(config, source, true)
    }

    if (modifyBuildConfig) {
      config = modifyBuildConfig(config)
    }

    const compiler = webpack(config)

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
      }),
    }
  }

  return create()
}
