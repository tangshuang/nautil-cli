const { DefinePlugin, HashedModuleIdsPlugin } = require('webpack')
const path = require('path')
const ModuleReplacePlugin = require('../../plugins/module-replace-webpack-plugin')
const TerserJSPlugin = require('terser-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const defineMapping = {}
const defineKeys = Object.keys(process.env)
defineKeys.forEach((key) => {
  defineMapping['process.env.' + key] = JSON.stringify(process.env[key])
})

const cwd = process.cwd()
const env = process.env.NODE_ENV
const runtime = process.env.RUNTIME_ENV
const platform = process.env.PLATFORM_ENV

// basic config
module.exports = {
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
  // only in web and hot-reload open, we will use '#eval-source-map'
  devtool: env === 'production' ? undefined : (runtime === 'dom' && !process.env.NO_HOT_RELOAD ? '#eval-source-map' : 'source-map'),
  devServer: {
    compress: true,
    port: 9000,
    historyApiFallback: true,
  },
  plugins: [
    new DefinePlugin(defineMapping),
    new HashedModuleIdsPlugin(),
    new ModuleReplacePlugin(
      source => source.indexOf(path.resolve(cwd, 'node_modules/nautil/lib/components')) === 0,
      source => runtime === 'react-native'
        ? source.replace('nautil/lib/components', 'nautil/lib/react-native-components')
        : source.replace('nautil/lib/components', 'nautil/lib/dom-components')
    ),
  ],
}
