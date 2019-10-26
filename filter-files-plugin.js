class FilterFilesPlugin {
  constructor(options) {
    this.options = options
  }
  apply(compiler) {
    compiler.hooks.emit.tap('FilterFilesPlugin', (compilation) => {
      const { options } = compilation
      const { match } = this.options
      compilation.chunks.forEach((chunk) => {
        chunk.files
        .filter(file => match && match.call(this, file, options))
        .forEach(file => {
          delete compilation.assets[file]
        })
      })
    })
  }
}

module.exports = FilterFilesPlugin
