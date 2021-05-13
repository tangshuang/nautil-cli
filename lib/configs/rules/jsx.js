const path = require('path')

const env = process.env.NODE_ENV
const cwd = process.cwd()

// files in this list should be es6 module and will be transform by babel
const includeFiles = [
  path.resolve(cwd, 'node_modules/ts-fns/es'),
  path.resolve(cwd, 'node_modules/tyshemo/src'),
  path.resolve(cwd, 'node_modules/rxjs/_esm2015'),
  path.resolve(cwd, 'node_modules/nautil/src'),
  path.resolve(cwd, 'node_modules/react-native'),
  path.resolve(cwd, 'src'),
]

const babelConfig = {
  cwd: path.resolve(__dirname, '../../..'),
  include: includeFiles,
  presets: [
    // must use injectPolyfill to import core-js and regenerator-runtime
    ['@babel/preset-env', { modules: false, useBuiltIns: 'entry', corejs: 3 }],
    '@babel/preset-react',
  ],
  plugins: [
    ['transform-class-remove-static-properties', { mode: env === 'production' ? 'remove' : 'wrap' }],
    'react-require',
  ],
}

const jsxLoaders = {
  test: /\.(jsx|js)$/,
  include: includeFiles,
  use: [
    {
      loader: 'babel-loader',
      options: babelConfig,
    },
  ],
}

function loadAsRequest(platform) {
  babelConfig.plugins.push([
    require.resolve('../../plugins/babel-plugin-nautil-import'),
    { platform },
  ])
}

function importAsEsSourceCode() {
  babelConfig.presets.forEach((item, i) => {
    if (Array.isArray(item) && item[0] === '@babel/preset-env') {
      babelConfig.presets.splice(i, 1)
    }
  })
}

module.exports = {
  babelConfig,
  jsxLoaders,
  includeFiles,
  loadAsRequest,
  importAsEsSourceCode,
}
