const path = require('path')

// files in this list should be es6 module and will be transform by babel
const rootDir = process.cwd()
const includeFiles = [
  path.resolve(rootDir, 'node_modules/ts-fns/src'),
  path.resolve(rootDir, 'node_modules/storagex/src'),
  path.resolve(rootDir, 'node_modules/tyshemo/src'),
  path.resolve(rootDir, 'node_modules/rxjs/_esm2015'),
  path.resolve(rootDir, 'node_modules/nautil'),
  path.resolve(rootDir, 'src'),
]

module.exports = {
  loader: 'babel-loader',
  include: includeFiles,
  options: {
    presets: [
      ['@babel/preset-env', {
        modules: false,
      }],
      '@babel/preset-react',
    ],
    plugins: [
      'react-require',
      '@babel/plugin-proposal-class-properties',
    ],
  },
}
