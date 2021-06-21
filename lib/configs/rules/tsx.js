const path = require('path')
const {
  babelConfig,
  loadAsRequest: _loadAsRequest,
  importAsEsSourceCode: _importAsEsSourceCode,
  loadPolyfills: _loadPolyfills,
  loadHotModule: _loadHotModule,
  hookIn,
} = require('./jsx')
const { clone } = require('ts-fns')

const tsxBabelConfig = clone(babelConfig)
tsxBabelConfig.presets.push(['@babel/preset-typescript', { isTSX: true }])
tsxBabelConfig.plugins.push(['const-enum', { transform: 'constObject' }])
const tsxBabelPresetEnvConfig = tsxBabelConfig.presets.find(item => item[0] === '@babel/preset-env')[1]

const tsxLoaders = {
  test: /\.(tsx|ts)$/,
  include: tsxBabelConfig.includeFiles,
  use: [
    {
      loader: 'babel-loader',
      options: tsxBabelConfig,
    },
  ],
}

hookIn('loadAsRequest', function loadAsRequest(platform) {
  tsxBabelConfig.plugins.push([
    require.resolve('../../plugins/babel-plugin-nautil-import'),
    { platform },
  ])
})

hookIn('importAsEsSourceCode', function importAsEsSourceCode() {
  tsxBabelConfig.presets.forEach((item, i) => {
    if (Array.isArray(item) && item[0] === '@babel/preset-env') {
      tsxBabelConfig.presets.splice(i, 1)
    }
  })
})

hookIn('loadPolyfills', function loadPolyfills({ corejs, index }) {
  const prependText = (corejs ? 'import "core-js";\n' : '') + 'import "regenerator-runtime/runtime";\n'
  if (!corejs) {
    tsxBabelPresetEnvConfig.corejs = false
  }
  tsxLoaders.use.push({
    loader: path.resolve(__dirname, '../../loaders/replace-content-loader.js'),
    options: {
      find: request => request === index,
      replace: content => prependText + content,
    },
  })
})

hookIn('loadHotModule', function loadHotModule(srcDir, entry) {
  const hotCode = [
    '\n',
    'if (module.hot) {',
    '  module.hot.accept()',
    '}',
  ].join('\n')
  tsxLoaders.use.push({
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
})

hookIn('changeBabelConfig', (change) => {
  change(tsxBabelConfig)
})

hookIn('changeBabelPresetEnvConfig', (change) => {
  change(tsxBabelPresetEnvConfig)
})

module.exports = {
  tsxBabelConfig,
  tsxLoaders,
}
