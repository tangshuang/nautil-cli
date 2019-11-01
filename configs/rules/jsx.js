const path = require('path')

const env = process.env.NODE_ENV
const cwd = process.cwd()

// files in this list should be es6 module and will be transform by babel
const includeFiles = [
  path.resolve(cwd, 'node_modules/ts-fns/src'),
  path.resolve(cwd, 'node_modules/storagex/src'),
  path.resolve(cwd, 'node_modules/tyshemo/src'),
  path.resolve(cwd, 'node_modules/rxjs/_esm2015'),
  path.resolve(cwd, 'node_modules/etx/src'),
  path.resolve(cwd, 'node_modules/asw/src'),
  path.resolve(cwd, 'node_modules/nautil'),
  path.resolve(cwd, 'node_modules/react-native'),
  path.resolve(cwd, 'node_modules/@babel/runtime/helpers/esm'),
  path.resolve(cwd, 'src'),
]

const babelConfig = {
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
}

const jsxLoader = {
  test: /\.(jsx|js)$/,
  include: includeFiles,
  use: [
    {
      loader: 'babel-loader',
      options: babelConfig,
    },
  ],
}

module.exports = {
  babelConfig,
  jsxLoader,
  includeFiles,
}
