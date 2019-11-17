const path = require('path')
const cwd = process.cwd()
const env = process.env.NODE_ENV
const noCssModule = process.env.NO_CSS_MODULE

const cssLoaderModuleConfig = {
  modules: {
    localIdentName: env === 'production' ? '[hash:base64]' : '[path][name]__[local]',
    hashPrefix: 'hash',
  },
  localsConvention: 'camelCaseOnly',
  sourceMap: true,
}

const postcssLoaderConfig = {
  config: {
    path: path.resolve(cwd, '.nautil'),
  },
  sourceMap: true,
}

const createStylesheetLoaders = (options = {}) => {
  const { modules = !noCssModule, less, sass } = options
  const loaders = [
    {
      loader: 'postcss-loader',
      options: postcssLoaderConfig,
    },
  ]
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

const cssLoaders = {
  test: /\.css$/,
  oneOf: [
    {
      resourceQuery: /no\-css\-module/,
      use: createStylesheetLoaders({ modules: false }),
    },
    {
      resourceQuery: /css\-module/,
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
      resourceQuery: /no\-css\-module/,
      use: createStylesheetLoaders({ less: true, modules: false }),
    },
    {
      resourceQuery: /css\-module/,
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
      resourceQuery: /no\-css\-module/,
      use: createStylesheetLoaders({ sass: true, modules: false }),
    },
    {
      resourceQuery: /css\-module/,
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
  createStylesheetLoaders,
  cssLoaderModuleConfig,
  postcssLoaderConfig,
  cssLoaders,
  lessLoaders,
  sassLoaders,
  unshiftStyesheetLoader,
  pushStyesheetLoader,
}
