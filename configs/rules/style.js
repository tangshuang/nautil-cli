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

const createStyleLoaders = (options = {}) => {
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

const cssLoader = {
  test: /\.css$/,
  oneOf: [
    {
      resourceQuery: /module/,
      use: createStyleLoaders({ modules: true }),
    },
    {
      resourceQuery: /no\-css\-module/,
      use: createStyleLoaders({ modules: false }),
    },
    {
      use: createStyleLoaders(),
    },
  ],
}

const lessLoader = {
  test: /\.less$/,
  oneOf: [
    {
      resourceQuery: /module/,
      use: createStyleLoaders({ less: true, modules: true }),
    },
    {
      resourceQuery: /no\-css\-module/,
      use: createStyleLoaders({ less: true, modules: false }),
    },
    {
      use: createStyleLoaders({ less: true }),
    },
  ],
}

const sassLoader = {
  test: /\.sass$/,
  oneOf: [
    {
      resourceQuery: /module/,
      use: createStyleLoaders({ sass: true, modules: true }),
    },
    {
      resourceQuery: /no\-css\-module/,
      use: createStyleLoaders({ sass: true, modules: false }),
    },
    {
      use: createStyleLoaders({ sass: true }),
    },
  ],
}

module.exports = {
  createStyleLoaders,
  cssLoaderModuleConfig,
  cssLoader,
  lessLoader,
  sassLoader,
}
