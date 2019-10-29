class BeforeHookPlugin {
  constructor(callback) {
    this.callback = callback
  }
  apply(compiler) {
    compiler.hooks.compilation.tap('BeforeHookPlugin', (compilation) => {
      compilation.hooks.buildModule.tap('BeforeHookPlugin', (module) => {
        this.callback(module, compilation)
      })
    })
  }
}

module.exports = BeforeHookPlugin
