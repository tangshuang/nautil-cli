const { DefinePlugin, HashedModuleIdsPlugin } = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const path = require('path')

const TerserJSPlugin = require('terser-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const dotenv = require('dotenv')

const env = process.env.NODE_ENV
const rootDir = process.cwd()

// 加载环境变量
dotenv.config()

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
      'etx': 'etx/src/etx.js'
    },
    modules: [
      path.resolve(rootDir, 'node_modules'),
    ],
  },
  optimization: {
    minimizer: env === 'production' ? [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})] : undefined,
    minimize: env === 'production' ? true : false,
    usedExports: true,
    sideEffects: true,
  },
  devtool: env === 'production' ? undefined : 'source-map',
  devServer: {
    compress: true,
    port: 9000,
    historyApiFallback: true,
  },
  plugins: [
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
    new CleanWebpackPlugin(),
    new HashedModuleIdsPlugin(),
  ],
}
