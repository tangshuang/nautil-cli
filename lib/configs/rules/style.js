const { babelConfig } = require('./jsx')
const path = require('path')

const env = process.env.NODE_ENV

const cssLoaderModuleConfig = {
  modules: {
    localIdentName: env === 'production' ? '[hash:base64]' : '[path][name]__[local]',
    localIdentHashPrefix: 'hash',
    exportOnlyLocals: true,
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
const unshiftStyesheetLoader = (config, loader) => {
  config.oneOf.forEach((item) => {
    item.use.unshift(loader)
  })
}

// push css loader
const pushStyesheetLoader = (config, loader) => {
  config.oneOf.forEach((item) => {
    item.use.push(loader)
  })
}

module.exports = {
  cssLoaderModuleConfig,
  cssLoaders,
  lessLoaders,
  sassLoaders,
  unshiftStyesheetLoader,
  pushStyesheetLoader,
  createStylesheetLoaders,
}
