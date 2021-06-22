const path = require('path')
const chalk = require('chalk')
const shell = require('shelljs')
const { exists, readJSON, remove } = require('../../utils/file')
const { mergeConfigs } = require('../../utils/utils')

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
  enableStylesheetSourceMap,
  createStylesheetLoaders,
} = require('../../configs/rules/style')
const { fileLoaders } = require('../../configs/rules/file')
const { decideby, map } = require('ts-fns')
const cache = require('../../configs/shared/cache')
const analysis = require('../../configs/shared/analyzer')
const { tsxLoaders } = require('../../configs/rules/tsx')

const { lazy: lazyInfo } = require('../../package.json')
const depsInfo = lazyInfo.filter(item => item.platforms.includes('native'))
const deps = {
  react: true,
}
depsInfo.forEach((item) => {
  const { dependencies } = item
  const depsMap = map(dependencies, () => true)
  Object.assign(deps, depsMap)
})

module.exports = function(source, dev) {
  const cwd = process.cwd()
  const env = process.env.NODE_ENV
  const srcDir = path.resolve(cwd, 'src', source)
  const configDir = path.resolve(cwd, '.nautil')
  const indexFile = path.resolve(srcDir, 'index.js')
  const configFile = path.resolve(configDir, 'cli-config.json')
  const nativeFile = path.resolve(srcDir, 'config.json')

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

  if (!nativeFile) {
    console.error(chalk.red(`${nativeFile} is not existing!`))
    shell.exit(1)
  }

  const { name: AppName } = readJSON(nativeFile)
  const distDir = path.resolve(cwd, AppName)

  if (!exists(distDir)) {
    console.error(chalk.red(`${distDir} is not existing!`))
    shell.exit(1)
  }

  const startTime = Date.now()

  // like babelrc { env: test: { ... } }
  const settings = readJSON(configFile)
  const configs = mergeConfigs(settings, env)

  const basicConfig = createBasicConfig('native', configs, source)
  const index = path.resolve(srcDir, 'index.js')
  const entry = [index]
  const plugins = []
  const loaders = [
    jsxLoaders,
    {
      test: /\.css$/,
      use: [
        {
          loader: 'react-native-css-loader',
        },
        ...createStylesheetLoaders(),
      ],
    },
    {
      test: /\.less$/,
      use: [
        {
          loader: 'react-native-css-loader',
        },
        ...createStylesheetLoaders({ less: true }),
      ],
    },
    {
      test: /\.(sass|scss)$/,
      use: [
        {
          loader: 'react-native-css-loader',
        },
        ...createStylesheetLoaders({ sass: true }),
      ],
    },
    fileLoaders,
  ]

  importAsEsSourceCode()
  loadAsRequest('native')
  enableStylesheetSourceMap(false)

  // import() -> require()
  changeBabelConfig((babelConfig) => {
    babelConfig.plugins.push(path.resolve(__dirname, '../../plugins/babel-plugin-import-statement-to-require.js'))
  })

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
    devtool: false, // we do not need sourcemap
    externals: deps, // dependencies was installed in AppName dir, not in local dir
  }

  // hook config
  const { build: modifyBuildConfig, dev: modifyDevConfig } = decideby(() => {
    if (exists(path.resolve(configDir, 'native.js'))) {
      return require(path.resolve(configDir, 'native.js'))
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
      config = modifyBuildConfig(config, source)
    }

    if (modifyDevConfig && dev) {
      config = modifyDevConfig(config, source)
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
        console.log(chalk.bold.green('Compiled! Cost time(ms): ' + duration))

        if (exists(path.resolve(distDir, 'App.js'))) {
          remove(path.resolve(distDir, 'App.js'))
        }

        shell.exit(0)
      }),
      watch: () => compiler.watch({
        ignored: /node_modules/,
      }, (err, stats) => {
        fallIntoError(err, stats)
        const { startTime, endTime } = stats
        const duration = endTime - startTime
        console.log(chalk.bold.green('Compiled! Cost time(ms): ' + duration))

        if (exists(path.resolve(distDir, 'App.js'))) {
          remove(path.resolve(distDir, 'App.js'))
        }
      }),
    }
  }

  return create()
}
