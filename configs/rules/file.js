const fileLoaderConfig = {
  limit: 8192, // in bytes
}
const fileLoader = {
  test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
  use: [
    {
      loader: 'url-loader',
      options: fileLoaderConfig,
    },
  ],
}

module.exports = {
  fileLoader,
  fileLoaderConfig,
}
