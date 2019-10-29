const env = process.env.NODE_ENV

module.exports = {
  loader: 'css-loader',
  options: {
    modules: {
      localIdentName: env === 'production' ? '[hash:base64]' : '[path][name]__[local]',
      hashPrefix: 'hash',
    },
    localsConvention: 'camelCaseOnly',
    sourceMap: env === 'production' ? false : true,
  },
}
