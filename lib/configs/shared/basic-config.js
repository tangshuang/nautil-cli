const { DefinePlugin } = require('webpack')
const path = require('path')
// const ModuleReplacePlugin = require('../../plugins/module-replace-webpack-plugin')
const TerserJSPlugin = require('terser-webpack-plugin')
const { decideby, map, parse } = require('ts-fns')
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
module.exports = function(platform, configs) {
  const cwd = process.cwd()
  const env = process.env.NODE_ENV
  const rcDir = path.resolve(cwd, '.nautil')

  const envFile = path.resolve(cwd, '.env')
  if (exists(envFile)) {
    dotenv.config({ path: envFile })
  }

  return {
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
        rxjs: path.resolve(cwd, 'node_modules/rxjs/_esm2015'),
        nautil: path.resolve(cwd, 'node_modules/nautil/src'),
        ...decideby(() => {
          if (configs.alias) {
            return map(configs.alias, file => path.resolve(rcDir, file))
          }
          return {}
        }),
      },
      extensions: [
        '.js',
        '.jsx',
      ],
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
      port: 9000,
      index: path.resolve(cwd, 'dist', platform, 'index.html'),
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
            : item.indexOf('process.env') ? JSON.stringify(parse(process.env, item.replace('process.env.', '')))
            : JSON.stringify(item)
          )
          const ds = convert(configs.define)
          Object.assign(defs, ds)
        }
        return defs
      })),
      // new ModuleReplacePlugin(
      //   source => source.indexOf(path.resolve(cwd, 'node_modules/nautil/src/lib/elements')) === 0,
      //   source => decideby(() => {
      //     if (process.env.NODE_ENV === 'development') {
      //       return source
      //     }
      //     if (platform === 'native') {
      //       return source.replace('nautil/src/lib/elements', 'nautil/src/native/elements')
      //     }
      //     if (['dom', 'web-component', 'ssr'].includes(platform)) {
      //       return source.replace('nautil/src/lib/elements', 'nautil/src/dom/elements')
      //     }
      //     // TODO: miniprogram
      //     return source
      //   })
      // ),
    ],
  }
}
