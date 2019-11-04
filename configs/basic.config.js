const { DefinePlugin, HashedModuleIdsPlugin } = require('webpack')
const path = require('path')
const ModuleReplacePlugin = require('../plugins/module-replace-webpack-plugin')
const TerserJSPlugin = require('terser-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const dotenv = require('dotenv')
const merge = require('webpack-merge')
const { exists } = require('../utils/file')

// load .env params
dotenv.config()
const define_mapping = {}
const define_keys = Object.keys(process.env)
define_keys.forEach((key) => {
  define_mapping['process.env.' + key] = JSON.stringify(process.env[key])
})

const env = process.env.NODE_ENV
const cwd = process.cwd()
const runtime = process.env.RUNTIME_ENV
const platform = process.env.PLATFORM_ENV

// set react-native APP_NAME
const nativePkgFile = path.resolve(cwd, 'react-native/package.json')
if (exists(nativePkgFile)) {
  const pkg = require(nativePkgFile)
  const { name } = pkg
  define_mapping['process.env.APP_NAME'] = JSON.stringify(name)
}

const hookFile = path.resolve(cwd, '.nautil/before.hook.js')
const hook = exists(hookFile) && require(hookFile)
const hookConfig = typeof hook === 'function' ? hook() : {}

// basic config
module.exports = merge(hookConfig, {
  mode: env === 'production' ? 'production' : 'none',
  output: {
    publicPath: '/',
  },
  resolve: {
    alias: {
      'ts-fns': 'ts-fns/src/index.js',
      'storagex': 'storagex/src/storagex.js',
      'tyshemo': 'tyshemo/src/index.js',
      'rxjs': 'rxjs/_esm2015/index.js',
      'etx': 'etx/src/etx.js',
      'asw': 'asw/src/index.js',
    },
    modules: [
      path.resolve(cwd, 'node_modules'),
    ],
    extensions: [
      '._' + runtime + '.js',
      '._' + platform + '.js',
      '._common.js',
      '.cjs',
      '.es',
      '.esm',
      '.js',
    ],
  },
  optimization: {
    minimizer: env === 'production' ? [
      new TerserJSPlugin({ extractComments: true }),
      new OptimizeCSSAssetsPlugin({
        assetNameRegExp: /\.(css|wxss)$/g,
      }),
    ] : undefined,
    minimize: env === 'production' ? true : false,
    usedExports: true,
    sideEffects: true,
  },
  devtool: env === 'production' ? undefined : runtime === 'dom' && process.env.NO_HOT_RELOAD ? 'source-map' : '#eval-source-map',
  devServer: {
    compress: true,
    port: 9000,
    historyApiFallback: true,
  },
  plugins: [
    new DefinePlugin(define_mapping),
    new HashedModuleIdsPlugin(),
    new ModuleReplacePlugin(
      source => source.indexOf(path.resolve(cwd, 'node_modules/nautil/lib/components')) === 0,
      source => runtime === 'native'
        ? source.replace('nautil/lib/components', 'nautil/lib/native-components')
        : source.replace('nautil/lib/components', 'nautil/lib/dom-components')
    ),
  ],
})
