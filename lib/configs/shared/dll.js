const path = require('path')
const DllPlugin = require('webpack/lib/DllPlugin')
const TerserJSPlugin = require('terser-webpack-plugin')

const basicConfig = require('./basic-config')
const { jsxLoaders } = require('../rules/jsx')
const { merge } = require('webpack-merge')

module.exports = function(distDir) {
  const dllConfig = {
    mode: 'production',
    target: 'web',
    entry: {
      react: ['react', 'react-dom'],
      nautil: ['nautil', 'i18next', 'immer', 'rxjs', 'scopex', 'tyshemo', 'ts-fns'],
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
    plugins: [
      new DllPlugin({
        name: '_dll_[name]',
        path: path.resolve(process.cwd(), '[name].manifest.json'),
        entryOnly: false,
      }),
    ],
    optimization: {
      minimizer: [
        new TerserJSPlugin({ extractComments: false }),
      ],
      minimize: true,
    },
    devtool: false,
  }

  const config = merge(basicConfig, dllConfig)

  return config
}
