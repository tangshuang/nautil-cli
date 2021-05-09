const { babelConfig } = require('./jsx')
const path = require('path')

const env = process.env.NODE_ENV

const cssModulesConfig = {
  esModule: true,
  modules: {
    namedExport: true,
  },
}
const cssLoaderModuleConfig = {
  esModule: true,
  modules: {
    localIdentName: env === 'production' ? '[hash:base64]' : '[path][name]__[local]',
    localIdentHashPrefix: 'hash',
    namedExport: true,
  },
  sourceMap: true,
}

const createStylesheetLoaders = (options = {}) => {
  const { modules, less, sass } = options
  const loaders = []
  if (modules) {
    loaders.unshift({
      loader: 'css-loader',
      options: cssLoaderModuleConfig,
    })
  }
  else {
    loaders.unshift({
      loader: 'css-loader',
      options: {
        sourceMap: true,
      },
    })
  }
  if (less) {
    loaders.push({
      loader: 'less-loader',
      options: {
        sourceMap: true,
      },
    })
  }
  if (sass) {
    loaders.push({
      loader: 'sass-loader',
      options: {
        sourceMap: true,
      },
    })
  }
  return loaders
}

// import styles from './style.css' -> css-modules
// import './style.css' -> no-css-modules
babelConfig.plugins.push(path.resolve(__dirname, '../../plugins/babel-plugin-auto-css-modules.js'))

const cssLoaders = {
  test: /\.css$/,
  oneOf: [
    {
      resourceQuery: /no\-css\-modules/,
      use: createStylesheetLoaders({ modules: false }),
    },
    {
      resourceQuery: /css\-modules/,
      use: createStylesheetLoaders({ modules: true }),
    },
    {
      use: createStylesheetLoaders(),
    },
  ],
}

const lessLoaders = {
  test: /\.less$/,
  oneOf: [
    {
      resourceQuery: /no\-css\-modules/,
      use: createStylesheetLoaders({ less: true, modules: false }),
    },
    {
      resourceQuery: /css\-modules/,
      use: createStylesheetLoaders({ less: true, modules: true }),
    },
    {
      use: createStylesheetLoaders({ less: true }),
    },
  ],
}

const sassLoaders = {
  test: /\.sass$/,
  oneOf: [
    {
      resourceQuery: /no\-css\-modules/,
      use: createStylesheetLoaders({ sass: true, modules: false }),
    },
    {
      resourceQuery: /css\-modules/,
      use: createStylesheetLoaders({ sass: true, modules: true }),
    },
    {
      use: createStylesheetLoaders({ sass: true }),
    },
  ],
}

// unshift css loader
const unshiftStyesheetLoader = (config, loader, options, toMod) => {
  config.oneOf.forEach((item) => {
    const { resourceQuery } = item
    const isModules = resourceQuery && resourceQuery.toString().indexOf('no') === 0
    if (toMod && isModules) {
      item.use.unshift({ loader, options })
    }
    else if (!toMod && !isModules) {
      item.use.unshift({ loader, options })
    }
  })
}

// push css loader
const pushStyesheetLoader = (config, loader, options, toMod) => {
  config.oneOf.forEach((item) => {
    const { resourceQuery } = item
    const isModules = resourceQuery && resourceQuery.toString().indexOf('no') === 0
    if (toMod && isModules) {
      item.use.push({ loader, options })
    }
    else if (!toMod && !isModules) {
      item.use.push({ loader, options })
    }
  })
}

module.exports = {
  cssModulesConfig,
  cssLoaderModuleConfig,
  cssLoaders,
  lessLoaders,
  sassLoaders,
  unshiftStyesheetLoader,
  pushStyesheetLoader,
  createStylesheetLoaders,
}