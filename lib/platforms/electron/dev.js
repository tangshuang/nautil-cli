const path = require('path')
const chalk = require('chalk')
const shell = require('shelljs')
const { exists, readJSON } = require('../../utils/file')
const { mergeConfigs } = require('../../utils/utils')

const webpack = require('webpack')
const { HotModuleReplacementPlugin } = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const { merge: mergeWebpackConfig } = require('webpack-merge')
const HtmlPlugin = require('html-webpack-plugin')
const createBasicConfig = require('../../configs/shared/basic-config')
const {
  jsxLoaders,
  loadAsRequest,
  importAsEsSourceCode,
  loadHotModule,
} = require('../../configs/rules/jsx')
const {
  cssLoaders,
  lessLoaders,
  sassLoaders,
  cssModulesConfig,
  unshiftStyesheetLoader,
} = require('../../configs/rules/style')
const { fileLoaders } = require('../../configs/rules/file')
const { decideby } = require('ts-fns')
const cache = require('../../configs/shared/cache')
const { tsxLoaders } = require('../../configs/rules/tsx')
const AfterHookPlugin = require('../../plugins/after-hook-webpack-plugin')

module.exports = function dev(source) {
  const cwd = process.cwd()
  const env = process.env.NODE_ENV
  const srcDir = path.resolve(cwd, 'src', source)
  const distDir = path.resolve(cwd, 'dist', source)
  const configDir = path.resolve(cwd, '.nautil')
  const indexFile = path.resolve(srcDir, 'index.js')
  const configFile = path.resolve(configDir, 'cli-config.json')

  if (!exists(configFile)) {
    console.error(chalk.red(`${configFile} is not existing!`))
    shell.exit(1)
  }

  // like babelrc { env: test: { ... } }
  const settings = readJSON(configFile)
  const configs = mergeConfigs(settings, env)

  const basicConfig = createBasicConfig('electron', configs, source)

  if (!exists(srcDir)) {
    console.error(chalk.red(`${srcDir} is not existing!`))
    shell.exit(1)
  }

  if (!exists(indexFile)) {
    console.error(chalk.red(`${indexFile} is not existing!`))
    shell.exit(1)
  }

  const index = path.resolve(srcDir, 'index.js')
  const entry = [index]
  const plugins = [
    new HtmlPlugin({
      template: path.resolve(srcDir, 'index.html'),
      filename: path.resolve(distDir, 'index.html'),
      inject: 'body',
      hash: true,
      xhtml: true,
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

  // less code
  importAsEsSourceCode()
  loadAsRequest('dom')

  unshiftStyesheetLoader(cssLoaders, 'style-loader', cssModulesConfig, true)
  unshiftStyesheetLoader(lessLoaders, 'style-loader', cssModulesConfig, true)
  unshiftStyesheetLoader(sassLoaders, 'style-loader', cssModulesConfig, true)
  unshiftStyesheetLoader(cssLoaders, 'style-loader')
  unshiftStyesheetLoader(lessLoaders, 'style-loader')
  unshiftStyesheetLoader(sassLoaders, 'style-loader')

  if (configs.typescript) {
    loaders.push(tsxLoaders)
  }

  // 生成所有所需的文件
  let created = false
  plugins.push(new AfterHookPlugin(() => {
    if (created) {
      return
    }

    copy(path.resolve(srcDir, 'main.js'), path.resolve(distDir, 'main.js'), true)
    const { icon } = readJSON(electronFile)
    if (exists(path.resolve(distDir, icon))) {
      remove(path.resolve(distDir, icon))
    }
    copy(path.resolve(srcDir, icon), path.resolve(distDir, icon))
    created = true
  }))

  const customConfig = {
    target: 'web',
    entry,
    output: {
      path: distDir,
      filename: `[name].[${HASH}].js`,
    },
    module: {
      rules: loaders,
    },
    plugins,
    devtool: 'eval',
    devServer: {
      writeToDisk: true,
    },
  }

  // hot reload
  if (configs.hot) {
    loadHotModule(srcDir, entry)
    plugins.push(new HotModuleReplacementPlugin())
  }

  const { dev: modifyDevConfig } = decideby(() => {
    if (exists(path.resolve(configDir, 'electron.js'))) {
      return require(path.resolve(configDir, 'electron.js'))
    }
    else {
      return {}
    }
  })

  let config = mergeWebpackConfig(basicConfig, customConfig)

  cache(config, source, true)

  if (modifyDevConfig) {
    config = modifyDevConfig(config, source)
  }

  const port = config.devServer.port
  config.output.publicPath = `http://localhost:${port}/`
  const compiler = webpack(config)
  const server = new WebpackDevServer(compiler, config.devServer)
  server.listen(port, () => console.log(chalk.bold.blue(`DevServer has been setup at http://localhost:${port}.`)))
}
