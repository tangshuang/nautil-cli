module.exports = class InjectDllHtmlWebpackPlugin {
  constructor(options) {
    this.options = options
  }
  apply(compiler) {
    const HtmlPlugin = exists(require.resolve('html-webpack-plugin')) ? require('html-webpack-plugin') : require(path.resolve(cwd, 'node_modules/html-webpack-plugin'))
    compiler.hooks.compilation.tap('InjectDllHtmlWebpackPlugin', (compilation) => {
      HtmlPlugin.getHooks(compilation).beforeAssetTagGeneration.tapAsync(
        'InjectDllHtmlWebpackPlugin', // <-- Set a meaningful name here for stacktraces
        (data, cb) => {
          data.assets.js.unshift(...this.options.files)
          // Tell webpack to move on
          cb(null, data)
        }
      )
    })
  }
}
