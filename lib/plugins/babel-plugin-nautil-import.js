const { read, exists } = require('../utils/file')
const path = require('path')
const t = require('@babel/types')

module.exports = function() {
  const cwd = process.cwd()

  let records = []

  return {
    visitor: {
      ImportDeclaration(x, state) {
        const { node } = x
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

        const imports = []
        const importsFromEntry = []

        if (specifiers.length) {
          specifiers.forEach((specifier) => {
            if (!t.isImportSpecifier(specifier)) {
              return
            }

            const { local, imported } = specifier
            const { name: localName } = local
            const { name: importedName } = imported

            if (!localName || !importedName) {
              throw x.buildCodeFrameError('An error occurred in parsing the abstract syntax tree')
            }

            const isImportedNameInFile = new RegExp(`\\W${importedName}\\W`).test(indexContents)

            if (importFrom === `nautil/${platform}` && !isImportedNameInFile) {
              throw x.buildCodeFrameError(`${importedName} can not be import from 'nautil/${platform}'`)
            }

            // those only exported from nautil not nautil/dom
            if (importFrom === 'nautil' && !isImportedNameInFile) {
              importsFromEntry.push(t.importSpecifier(local, imported))
            }
            else {
              const [_matched, toFile] = indexContents.match(new RegExp(`\\W${importedName}\\W.*?from '(.*?)'`, 'm'))
              const importedUrl = path.resolve(path.dirname(indexFile), toFile).replace(path.resolve(cwd, 'node_modules/nautil', 'nautil'))
              imports.push(
                t.importDeclaration(
                  [t.importSpecifier(local, imported)],
                  t.StringLiteral(importedUrl),
                ),
              )
            }
          })
        }

        // import './style/sytle.js' -> to override feature
        indexContents.split('\n').forEach((line) => {
          const [_, file] = line.match(/import\s+['"](.*?)['"]/) || []
          if (file) {
            imports.push(
              t.importDeclaration(
                [],
                t.StringLiteral(path.resolve(srcDir, platform, file)),
              )
            )
          }
        })

        if (importsFromEntry.length) {
          imports.unshift(
            t.importDeclaration(
              importsFromEntry,
              t.StringLiteral('nautil'),
            ),
          )
        }

        records.push({
          path: x,
          imports,
        })
      },
      Program: {
        enter() {
          records = []
        },
        exit() {
          if (records.length) {
            records.forEach(({ path, imports }) => {
              path.replaceWithMultiple(imports)
            })
          }
          records = []
        },
      },
    },
  }
}
