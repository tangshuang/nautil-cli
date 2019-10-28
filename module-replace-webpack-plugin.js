/*
 * referer to https://github.com/webpack/webpack/blob/master/lib/ModuleReplacePlugin.js
 */

const path = require('path')

class ModuleReplacePlugin {
  constructor(find, replace) {
    this.find = find
    this.replace = replace
  }

  apply(compiler) {
    const { find, replace } = this
    compiler.hooks.normalModuleFactory.tap("ModuleReplacePlugin", (nmf) => {
        nmf.hooks.beforeResolve.tap("ModuleReplacePlugin", (result) => {
          const { request, context } = result
          const source = path.resolve(context, request)

          let match = false
          if (typeof find === 'function' && find(source, request)) {
            match = true
          }
          else if (find instanceof RegExp && find.test(source)) {
            match = true
          }
          else if (typeof find === 'string' && find === source) {
            match = true
          }

          if (!match) {
            return
          }

          if (typeof replace === 'function') {
            result.request = replace(source, request)
          }
          else if (typeof replace === 'string') {
            result.request = replace
          }
        });
      }
    );
  }
}

module.exports = ModuleReplacePlugin;
