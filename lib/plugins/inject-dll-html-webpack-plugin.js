const HtmlPlugin = require('html-webpack-plugin')

module.exports = class InjectDllHtmlWebpackPlugin {
  constructor(options) {
    this.options = options
  }
  apply(compiler) {
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
