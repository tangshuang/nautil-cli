const path = require('path')
const env = process.env.NODE_ENV

// files in this list should be es6 module and will be transform by babel
const rootDir = process.cwd()
const includeFiles = [
  path.resolve(rootDir, 'node_modules/ts-fns/src'),
  path.resolve(rootDir, 'node_modules/storagex/src'),
  path.resolve(rootDir, 'node_modules/tyshemo/src'),
  path.resolve(rootDir, 'node_modules/rxjs/_esm2015'),
  path.resolve(rootDir, 'node_modules/etx/src'),
  path.resolve(rootDir, 'node_modules/nautil'),
  path.resolve(rootDir, 'node_modules/react-native'),
  path.resolve(rootDir, 'node_modules/@babel/runtime/helpers/esm'),
  path.resolve(rootDir, 'src'),
]

module.exports = {
  loader: 'babel-loader',
  options: {
    include: includeFiles,
    presets: [
      ['@babel/preset-env', {
        modules: false,
      }],
      '@babel/preset-react',
    ],
    plugins: [
      ['transform-class-remove-static-properties', {
        mode: env === 'production' ? 'remove' : 'wrap',
      }],
      'react-require',
      ['@babel/plugin-proposal-class-properties', {
        loose: true,
      }],
      '@babel/plugin-transform-runtime',
    ],
  },
}
