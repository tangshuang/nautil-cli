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

const babelPresetEnvConfig = {
  modules: false,
  useBuiltIns: 'entry',
  corejs: 3,
}

const babelConfig = {
  cwd: path.resolve(__dirname, '../../..'),
  presets: [
    // must use injectPolyfill to import core-js and regenerator-runtime
    ['@babel/preset-env', babelPresetEnvConfig],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  plugins: [
    ['transform-class-remove-static-properties', { mode: env === 'production' ? 'remove' : 'wrap' }],
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

const hooks = {
  loadAsRequest: [],
  importAsEsSourceCode: [],
  loadPolyfills: [],
  loadHotModule: [],
  changeBabelConfig: [],
  changeBabelPresetEnvConfig: [],
}

function loadAsRequest(platform) {
  babelConfig.plugins.push([
    require.resolve('../../plugins/babel-plugin-nautil-import'),
    { platform },
  ])
  hooks.loadAsRequest.forEach((fn) => {
    fn(platform)
  })
}

function importAsEsSourceCode() {
  babelConfig.presets.forEach((item, i) => {
    if (Array.isArray(item) && item[0] === '@babel/preset-env') {
      babelConfig.presets.splice(i, 1)
    }
  })
  hooks.importAsEsSourceCode.forEach((fn) => {
    fn()
  })
}

function loadPolyfills({ corejs, index }) {
  const prependText = (corejs ? 'import "core-js";\n' : '') + 'import "regenerator-runtime/runtime";\n'
  if (!corejs) {
    babelPresetEnvConfig.corejs = false
  }
  jsxLoaders.use.push({
    loader: path.resolve(__dirname, '../../loaders/replace-content-loader.js'),
    options: {
      find: request => request === index,
      replace: content => prependText + content,
    },
  })
  hooks.loadPolyfills.forEach((fn) => {
    fn({ corejs, index })
  })
}

function loadHotModule(srcDir, entry) {
  const hotCode = [
    '\n',
    'if (module.hot) {',
    '  module.hot.accept()',
    '}',
  ].join('\n')
  jsxLoaders.use.push({
    loader: path.resolve(__dirname, '../../loaders/replace-content-loader.js'),
    options: {
      find: (request) => {
        if (!request) {
          return false
        }
        if (request.indexOf(srcDir) !== 0) {
          return false
        }
        if (entry.indexOf(request) === -1) {
          return false
        }
        return true
      },
      replace: content => content + hotCode,
    },
  })
  hooks.loadHotModule.forEach((fn) => {
    fn(srcDir, entry)
  })
}

function changeBabelConfig(change) {
  change(babelConfig)
  hooks.changeBabelConfig.forEach((fn) => {
    fn(change)
  })
}

function changeBabelPresetEnvConfig(change) {
  change(babelPresetEnvConfig)
  hooks.changeBabelPresetEnvConfig.forEach((fn) => {
    fn(change)
  })
}

function hookIn(type, fn) {
  if (hooks[type]) {
    hooks[type].push(fn)
  }
}

module.exports = {
  includeFiles,
  babelConfig,
  jsxLoaders,
  loadAsRequest,
  importAsEsSourceCode,
  loadPolyfills,
  loadHotModule,
  changeBabelConfig,
  changeBabelPresetEnvConfig,
  hookIn,
}
