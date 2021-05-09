const path = require('path')
const chalk = require('chalk')
const shell = require('shelljs')
const { exists, readJSON } = require('../../utils/file')
const { mergeConfigs } = require('../../utils/utils')
const { log } = require('../../utils/log')

const webpack = require('webpack')
const { HotModuleReplacementPlugin } = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const { merge: mergeWebpackConfig } = require('webpack-merge')
const HtmlPlugin = require('html-webpack-plugin')
const createBasicConfig = require('../../configs/shared/basic-config')
const splitChunksConfig = require('../../configs/shared/split-chunks')
const dllref = require('../../configs/shared/dll-refer')
const dll = require('../../configs/shared/dll')
const { jsxLoaders, babelConfig } = require('../../configs/rules/jsx')
const { cssLoaders, lessLoaders, sassLoaders, unshiftStyesheetLoader } = require('../../configs/rules/style')
const { fileLoaders } = require('../../configs/rules/file')

module.exports = function dev(callback) {
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

  const index = path.resolve(srcDir, 'index.js')
  const entry = [index]
  const plugins = [
    new HtmlPlugin({
      template: path.resolve(srcDir, 'index.html'),
      filename: path.resolve(distDir, 'index.html'),
    }),
  ]

  // polyfill less code
  const presetEnvConfig = babelConfig.presets[0][1]
  Object.assign(presetEnvConfig, {
    exclude: [
      '@babel/plugin-transform-regenerator'
    ],
    targets: 'last 2 chrome versions',
  })

  jsxLoaders.use.push({
    loader: path.resolve(__dirname, '../../loaders/replace-content-loader.js'),
    options: {
      find: request => request === index,
      replace: content => 'import "core-js";\n' + content,
    },
  })

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
    devServer: {
      ...(configs.devServer || {}),
      contentBase: distDir,
    },
    devtool: 'source-map',
  }

  unshiftStyesheetLoader(cssLoaders, 'style-loader')
  unshiftStyesheetLoader(lessLoaders, 'style-loader')
  unshiftStyesheetLoader(sassLoaders, 'style-loader')

  // hot reload
  if (configs.hot) {
    // TODO: react-hot-loader seems not working in nautil-cli, we are waiting for a more helpful tool
    // babelConfig.plugins.push('react-hot-loader/babel')
    // entry.unshift('react-hot-loader/patch')

    customConfig.devServer = {
      ...customConfig.devServer,
      inline: true,
      hot: true,
      liveReload: false,
    }

    plugins.push(new HotModuleReplacementPlugin())

    const hotCode = [
      '\n',
      'if (module.hot) {',
      '  module.hot.accept()',
      '}',
    ].join('\n')
    jsxLoaders.use.push({
      loader: path.resolve(__dirname, '../../loaders/replace-content-loader.js'),
      options: {
        find: (request) => {
          if (!request) {
            return false
          }
          if (request.indexOf(srcDir) !== 0) {
            return false
          }
          if (entry.indexOf(request) === -1) {
            return false
          }
          return true
        },
        replace: content => content + hotCode,
      },
    })
  }

  const splitConfig = configs.dll ? dllref(distDir)
    : configs.chunks ? splitChunksConfig
    : {}
  const config = mergeWebpackConfig(basicConfig, customConfig, splitConfig)

  log(JSON.stringify(config, null, 4))

  const serve = () => {
    const compiler = webpack(config)
    const server = new WebpackDevServer(compiler, config.devServer)
    server.listen(config.devServer.port, () => console.log(chalk.blue(`DevServer has been setup at http://localhost:${port}`)))
  }

  if (configs.dll && !exists(path.resolve(distDir, 'react.dll.js') && !exists(path.resolve(distDir, 'nautil.dll.js')))) {
    const compiler = webpack(dll(distDir))
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

        serve()
      })
    })
  }
  else {
    serve()
  }
}
