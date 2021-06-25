const { DefinePlugin } = require('webpack')
const path = require('path')
// const ModuleReplacePlugin = require('../../plugins/module-replace-webpack-plugin')
const TerserJSPlugin = require('terser-webpack-plugin')
const { decideby, map, parse, find, isArray } = require('ts-fns')
const dotenv = require('dotenv')
const { read, exists } = require('../../utils/file')

/**
 * @param {*} platform
 * @param {*} configs
 * @param {object} configs.alias
 * @param {boolean} configs.hot
 * @param {boolean} configs.live
 * @param {object} configs.define
 * @returns
 */
module.exports = function(platform, configs, source) {
  const cwd = process.cwd()
  const env = process.env.NODE_ENV
  const rcDir = path.resolve(cwd, '.nautil')

  const envFile = path.resolve(cwd, '.env')
  if (exists(envFile)) {
    dotenv.config({ path: envFile })
  }

  const extensions = [
    '.tsx',
    '.jsx',
    '.ts',
    '.js',
  ]

  if (configs.source && configs.source[source] && isArray(configs.source[source].extensions)) {
    extensions.unshift(...configs.source[source].extensions)
  }

  const webpackConfig = {
    mode: env === 'production' ? 'production' : 'none',
    output: {
      publicPath: '/',
    },
    resolveLoader: {
      modules: [
        path.resolve(__dirname, '../../../node_modules'),
        path.resolve(cwd, 'node_modules'),
      ],
    },
    resolve: {
      modules: [
        path.resolve(__dirname, '../../../node_modules'),
        path.resolve(cwd, 'node_modules'),
      ],
      alias: {
        'ts-fns': path.resolve(cwd, 'node_modules/ts-fns/es'),
        tyshemo: path.resolve(cwd, 'node_modules/tyshemo/src'),
        rxjs: path.resolve(cwd, 'node_modules/rxjs/dist/esm'), // version >= 7.1.0
        nautil: path.resolve(cwd, 'node_modules/nautil/src'),
        ...decideby(() => {
          if (configs.alias) {
            return map(configs.alias, file => path.resolve(rcDir, file))
          }
          return {}
        }),
      },
      extensions,
    },
    optimization: {
      minimizer: env === 'production' ? [
        new TerserJSPlugin({ extractComments: false }),
      ] : undefined,
      minimize: env === 'production' ? true : false,
      usedExports: true,
      sideEffects: true,
    },
    // only in web and hot-reload open, we will use '#eval-source-map'
    devtool: configs.sourceMap ? 'source-map' : undefined,
    devServer: {
      inline: configs.hot || configs.live,
      hot: configs.hot,
      liveReload: !configs.hot && configs.live,
      compress: true,
      port: configs.port || 9000,
      host: configs.host || '127.0.0.1',
      index: 'index.html',
      historyApiFallback: true,
      proxy: configs.proxy || undefined,
    },
    plugins: [
      new DefinePlugin(decideby(() => {
        const defs = {
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
          'process.env.PLATFORM': JSON.stringify(platform),
        }

        if (exists(envFile)) {
          const env = read(envFile)
          const envKeys = env.split('\n')
            .filter(item => item.indexOf('#') === 0 ? false : !!item.trim())
            .map(item => item.split('=')[0])
          const keys = Object.keys(process.env)
          keys.forEach((key) => {
            if (envKeys.includes(key)) {
              defs['process.env.' + key] = JSON.stringify(process.env[key])
            }
          })
        }

        if (configs.define) {
          const convert = (items) => map(items, item =>
            typeof item === 'object' ? convert(item)
            : item.indexOf('process.env') === 0 ? JSON.stringify(parse(process.env, item.replace('process.env.', '')))
            : JSON.stringify(item)
          )
          const ds = convert(configs.define)
          Object.assign(defs, ds)
        }
        return defs
      })),
    ],
  }

  if (configs.source && configs.source[source] && configs.source[source].library) {
    webpackConfig.output.library = configs.source[source].library
    webpackConfig.output.libraryTarget = configs.source[source].libraryTarget
    webpackConfig.output.globalObject = configs.source[source].globalObject
  }

  return webpackConfig
}
