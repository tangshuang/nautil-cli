module.exports = {
  loader: 'css-loader',
  options: {
    modules: {
<<<<<<< HEAD
      localIdentName: process.env.NODE_ENV === 'production' ? '[hash:base64:8]' : '[path][name]__[local]',
      hashPrefix: 'hash',
=======
      localIdentName: process.env.NODE_ENV === 'production' ? '[hash:base64]' : '[path][name]__[local]',
>>>>>>> b0dfe7488fb2ca4adeba96b2b231dbdfacb51c59
    },
    localsConvention: 'camelCaseOnly',
  },
}
