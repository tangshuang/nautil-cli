const path = require('path')
const chalk = require('chalk')
const shell = require('shelljs')
const { exists, readJSON, read } = require('../../utils/file')
const { mergeConfigs } = require('../../utils/utils')

const WebComponentCssPlugin = require('../../plugins/web-component-css-webpack-plugin')
const HtmlPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const webpack = require('webpack')
const { HotModuleReplacementPlugin } = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const { merge: mergeWebpackConfig } = require('webpack-merge')
const createBasicConfig = require('../../configs/shared/basic-config')
const {
  jsxLoaders,
  loadAsRequest,
  importAsEsSourceCode,
  loadHotModule,
  changeBabelConfig,
} = require('../../configs/rules/jsx')
const {
  cssLoaders,
  lessLoaders,
  sassLoaders,
  cssModulesConfig,
  unshiftStyesheetLoader,
  enableStylesheetSourceMap,
} = require('../../configs/rules/style')
const { fileLoaders, fileLoaderConfig } = require('../../configs/rules/file')
const { decideby } = require('ts-fns')
const cache = require('../../configs/shared/cache')
const { tsxLoaders } = require('../../configs/rules/tsx')

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

  const basicConfig = createBasicConfig('web-component', configs, source)

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

  const indexContent = read(index)
  const [, _placeholder] = indexContent.match(/define\(.*?,.*?,(.*?)\)/)
  const placeholder = _placeholder ? _placeholder.trim() : undefined

  const plugins = [
    new HtmlPlugin({
      template: path.resolve(srcDir, 'index.html'),
      filename: path.resolve(distDir, 'index.html'),
      inject: 'body',
      hash: true,
      xhtml: true,
    }),
    new WebComponentCssPlugin({
      placeholder,
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
  enableStylesheetSourceMap(false)
  importAsEsSourceCode()
  loadAsRequest('web-component')

  // all files should be convert to be base64
  fileLoaderConfig.limit = 1000000000

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

  // import() -> require()
  changeBabelConfig((babelConfig) => {
    babelConfig.plugins.push(path.resolve(__dirname, '../../plugins/babel-plugin-import-statement-to-require.js'))
  })

  if (configs.typescript) {
    loaders.push(tsxLoaders)
  }

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
    optimization: {
      minimizer: env === 'production' ? [
        new OptimizeCSSAssetsPlugin({
          assetNameRegExp: /\.(css|wxss)$/g,
        }),
      ] : undefined,
    },
  }

  // hot reload
  if (configs.hot) {
    customConfig.devServer = {
      inline: true,
      hot: true,
      liveReload: false,
    }

    loadHotModule(srcDir, entry)
    plugins.push(new HotModuleReplacementPlugin())
  }

  const { dev: modifyDevConfig } = decideby(() => {
    if (exists(path.resolve(configDir, 'web-component.js'))) {
      return require(path.resolve(configDir, 'web-component.js'))
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

  const compiler = webpack(config)
  const server = new WebpackDevServer(compiler, config.devServer)
  const port = config.devServer.port
  server.listen(port, () => console.log(chalk.bold.blue(`DevServer has been setup at http://localhost:${port}`)))
}
