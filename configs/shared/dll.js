const path = require('path')
const DllPlugin = require('webpack/lib/DllPlugin')

const basicConfig = require('./shared/basic-config')
const { jsxLoaders } = require('./rules/jsx')

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
  }

  const config = merge(basicConfig, dllConfig)

  return config
}
