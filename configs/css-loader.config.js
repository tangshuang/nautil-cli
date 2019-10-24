module.exports = {
  loader: 'css-loader',
  options: {
    modules: {
      localIdentName: process.env.NODE_ENV === 'production' ? '[hash:base64:8]' : '[path][name]__[local]',
      hashPrefix: 'hash',
    },
    localsConvention: 'camelCaseOnly',
  },
}
