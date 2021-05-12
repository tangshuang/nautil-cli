const { read, exists } = require('../utils/file')
const path = require('path')
const t = require('@babel/types')

module.exports = function() {
  const cwd = process.cwd()

  return {
    visitor: {
      ImportDeclaration(x, state) {
        const { node, scope } = x
        if (!node) {
          return
        }

        const { source, specifiers } = node
        const { value: importFrom } = source

        if (importFrom.split('/')[0] !== 'nautil') {
          return
        }

        const { platform } = state.opts
        if (!platform) {
          throw new Error('babel-plugin-nautil-import should must set options.platform')
        }

        // only support for import {} from 'nautil' and import {} from 'nautil/dom|native|...'
        if (importFrom !== 'nautil' && importFrom !== `nautil/${platform}`) {
          return
        }

        const srcDir = path.resolve(cwd, 'node_modules/nautil/src')
        const indexFile = path.resolve(srcDir, platform, 'index.js')

        if (!exists(indexFile)) {
          throw new Error(`babel-plugin-nautil-import options.platform:${platform} is not avaliable`)
        }

        const indexContents = read(indexFile)

        const ids = {}
        const imports = []

        specifiers.forEach((specifier) => {
          if (!t.isImportSpecifier(specifier)) {
            return
          }

          const {
            local: { name: localName },
            imported: { name: importedName },
          } = specifier

          if (!localName || !importedName) {
            throw x.buildCodeFrameError('An error occurred in parsing the abstract syntax tree')
          }

          if (scope.getBinding(localName).references === 0) {
            return
          }

          const isImportedNameInFile = new RegExp(`\\W${importedName}\\W`).test(indexContents)

          if (importFrom === `nautil/${platform}` && !isImportedNameInFile) {
            throw x.buildCodeFrameError(`${importedName} can not be import from 'nautil/${platform}'`)
          }

          const id = scope.generateUid(`_${localName}`)
          ids[localName] = id

          // those only exported from nautil not nautil/dom
          if (importFrom === 'nautil' && !isImportedNameInFile) {
            imports.push(
              t.importDeclaration(
                [t.importNamespaceSpecifier(t.identifier(id))],
                t.StringLiteral('nautil'),
              ),
            )
          }
          else {
            const [_matched, toFile] = indexContents.match(new RegExp(`\\W${importedName}\\W.*?from '(.*?)'`, 'm'))
            const imported = path.resolve(path.dirname(indexFile), toFile).replace(path.resolve(cwd, 'node_modules/nautil', 'nautil'))
            imports.push(
              t.importDeclaration(
                [t.importNamespaceSpecifier(t.identifier(id))],
                t.StringLiteral(imported),
              ),
            )
          }

          const currentBinding = scope.getBinding(localName)
          currentBinding.referencePaths.forEach((scopePath) => {
            const { type } = scopePath
            if (type === 'JSXIdentifier') {
              scopePath.replaceWith(t.jSXIdentifier(id))
            }
            else {
              scopePath.replaceWith(t.identifier(id))
            }
          })
        })

        if (imports.length) {
          x.replaceWithMultiple(imports)
        }
      },
    },
  }
}
