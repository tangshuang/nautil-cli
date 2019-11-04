const { RawSource, ReplaceSource, OriginalSource, SourceMapSource } = require('webpack-sources')

class ModuleModifyPlugin {
  constructor(find, replace) {
    this.find = find
    this.replace = replace
  }
  apply(compiler) {
    const { find, replace } = this
    compiler.hooks.compilation.tap('ModuleModifyPlugin', (compilation) => {
      compilation.hooks.succeedModule.tap('ModuleModifyPlugin', (module) => {
        // filter
        const { resource } = module
        let match = false
        if (typeof find === 'function' && find.call(compilation, resource, module)) {
          match = true
        }
        else if (find instanceof RegExp && find.test(resource)) {
          match = true
        }
        else if (typeof find === 'string' && find === resource) {
          match = true
        }

        if (!match) {
          return
        }

        // modify
        const replaceBy = (source) => {
          const content = source.source()

          let replacement = content
          if (typeof replace === 'function') {
            replacement = replace.call(compilation, content, source)
          }
          else if (typeof replace === 'string') {
            replacement = replace
          }

          source.replace(0, content.length, replacement)
          const newContent = source.source()
          return newContent
        }

        const originalSource = module._source
        if (originalSource instanceof SourceMapSource) {
          const { _name, _sourceMap, _originalSource, _innerSourceMap, _removeOriginalSource } = originalSource
          const source = new ReplaceSource(originalSource, _name)
          const newContent = replaceBy(source)
          const newSource = new SourceMapSource(newContent, _name, _sourceMap, _originalSource, _innerSourceMap, _removeOriginalSource)
          module._source = newSource
        }
        else if (originalSource instanceof RawSource) {
          const source = new ReplaceSource(originalSource)
          const newContent = replaceBy(source)
          const newSource = new RawSource(newContent)
          module._source = newSource
        }
        else if (originalSource instanceof OriginalSource) {
          const { _name } = originalSource
          const source = new ReplaceSource(originalSource, _name)
          const newContent = replaceBy(source)
          const newSource = new OriginalSource(newContent, _name)
          module._source = newSource
        }
      })
    })
  }
}

module.exports = ModuleModifyPlugin
