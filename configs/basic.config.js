const { DefinePlugin, HashedModuleIdsPlugin } = require('webpack')
const path = require('path')

const TerserJSPlugin = require('terser-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const dotenv = require('dotenv')

const env = process.env.NODE_ENV
const rootDir = process.cwd()

const { exists } = require('../utils/file')
const customDevServerConfigFile = path.resolve(rootDir, '.nautil/dev-server.config.js')
const customDevServerConfig = exists(customDevServerConfigFile) ? require(customDevServerConfigFile) : {}

// 加载环境变量
dotenv.config()
const define_mapping = {}
const define_keys = Object.keys(process.env)
define_keys.forEach((key) => {
  define_mapping['process.env.' + key] = JSON.stringify(process.env[key])
})

module.exports = {
  mode: env === 'production' ? 'production' : 'none',
  output: {
    // globalObject: `typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : this`,
  },
  resolve: {
    alias: {
      'ts-fns': 'ts-fns/src/index.js',
      'storagex': 'storagex/src/storagex.js',
      'tyshemo': 'tyshemo/src/index.js',
      'rxjs': 'rxjs/_esm2015/index.js',
      'etx': 'etx/src/etx.js',
      'asw': 'asw/src/index.js',
      '../components/index.js': process.env.RUNTIME_ENV === 'native' ? '../native-components/index.js' : '../dom-components/index.js',
    },
    modules: [
      path.resolve(rootDir, 'node_modules'),
    ],
  },
  optimization: {
    minimizer: env === 'production' ? [new TerserJSPlugin({ extractComments: true }), new OptimizeCSSAssetsPlugin({})] : undefined,
    minimize: env === 'production' ? true : false,
    usedExports: true,
    sideEffects: true,
  },
  devtool: env === 'production' ? undefined : 'source-map',
  devServer: {
    compress: true,
    port: 9000,
    historyApiFallback: true,
    ...customDevServerConfig,
  },
  plugins: [
    new DefinePlugin(define_mapping),
    new HashedModuleIdsPlugin(),
  ],
}
