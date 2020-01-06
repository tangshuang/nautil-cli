const { DefinePlugin, HashedModuleIdsPlugin } = require('webpack')
const path = require('path')
const ModuleReplacePlugin = require('../../plugins/module-replace-webpack-plugin')
const TerserJSPlugin = require('terser-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const { readJSON } = require('../../utils/file')
const camelCase = require('camelcase')
const DeepScopePlugin = require('webpack-deep-scope-plugin')

const cwd = process.cwd()
const env = process.env.NODE_ENV
const runtime = process.env.RUNTIME_ENV
const platform = process.env.PLATFORM_ENV

const defineMapping = {}
const defineKeys = Object.keys(process.env)
defineKeys.forEach((key) => {
  defineMapping['process.env.' + key] = JSON.stringify(process.env[key])
})

// use the project name as default react-native app name
const pkgfile = path.resolve(cwd, 'package.json')
const json = readJSON(pkgfile)
if (!defineMapping['process.env.app_name']) {
  const appname = json.name.toLowerCase()
  defineMapping['process.env.app_name'] = JSON.stringify(appname)
}
if (!defineMapping['process.env.APP_NAME']) {
  const AppName = camelCase(json.name, { pascalCase: true })
  defineMapping['process.env.APP_NAME'] = JSON.stringify(AppName)
}

// basic config
module.exports = {
  mode: env === 'production' ? 'production' : 'none',
  output: {
    publicPath: '/',
  },
  resolve: {
    alias: {
      'ts-fns': 'ts-fns/es/index.js',
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
    new DeepScopePlugin(),
  ],
}
