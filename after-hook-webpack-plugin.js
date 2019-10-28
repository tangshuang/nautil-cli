class AfterHookPlugin {
  constructor(callback) {
    this.callback = callback
  }
  apply(compiler) {
    compiler.hooks.afterEmit.tap('AfterHookPlugin', (compilation) => {
      this.callback(compilation.assets)
    })
  }
}

module.exports = AfterHookPlugin
