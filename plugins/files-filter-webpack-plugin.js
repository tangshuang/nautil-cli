class FilesFilterPlugin {
  constructor(callback) {
    this.callback = callback
  }
  apply(compiler) {
    compiler.hooks.emit.tap('FilesFilterPlugin', (compilation) => {
      const { callback } = this
      compilation.chunks.forEach((chunk) => {
        chunk.files
        .filter(file => callback.call(compilation ,file))
        .forEach(file => {
          delete compilation.assets[file]
        })
      })
    })
  }
}

module.exports = FilesFilterPlugin
