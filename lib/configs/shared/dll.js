const path = require('path')
const DllPlugin = require('webpack/lib/DllPlugin')
const TerserJSPlugin = require('terser-webpack-plugin')

const basicConfig = require('./basic-config')
const { jsxLoaders } = require('../rules/jsx')
const { merge } = require('webpack-merge')
const createBasicConfig = require('./basic-config')

module.exports = function(manifestDir, distDir, configs) {
  const env = process.env.NODE_ENV
  const basicConfig = createBasicConfig('dom', configs)

  const dllConfig = {
    mode: env === 'production' ? 'production' : 'none',
    target: 'web',
    entry: {
      react: ['react', 'react-dom'],
      nautil: ['i18next', 'immer', 'rxjs', 'scopex', 'tyshemo', 'ts-fns'],
    },
    output: {
      filename: '[name].dll.js',
      path: distDir,
      library: '_dll_[name]',
    },
    module: {
      rules: [
        jsxLoaders,
      ],
    },
    resolve: basicConfig.resolve,
    resolveLoader: basicConfig.resolveLoader,
    plugins: [
      new DllPlugin({
        name: '_dll_[name]',
        path: path.resolve(manifestDir, '[name].manifest.json'),
        entryOnly: false,
      }),
      ...basicConfig.plugins,
    ],
    optimization: basicConfig.optimization,
    devtool: false,
  }

  const config = merge(basicConfig, dllConfig)

  return config
}
