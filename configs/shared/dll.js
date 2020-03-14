const path = require('path')
const DllPlugin = require('webpack/lib/DllPlugin')
const merge = require('webpack-merge')
const TerserJSPlugin = require('terser-webpack-plugin')

const basicConfig = require('./basic-config')
const { jsxLoaders } = require('../rules/jsx')

module.exports = function(distDir) {
  const dllConfig = {
    mode: 'production',
    target: 'web',
    entry: {
      react: ['react', 'react-dom'],
      nautil: ['nautil', 'ts-fns', 'storagex', 'tyshemo', 'rxjs', 'etx', 'asw'],
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
        path: path.resolve(distDir, '[name].manifest.json'),
      }),
    ],
    optimization: {
      minimizer: [
        new TerserJSPlugin({ extractComments: true }),
      ],
      minimize: true,
    },
    devtool: 'source-map',
  }

  const config = merge(basicConfig, dllConfig)

  return config
}
