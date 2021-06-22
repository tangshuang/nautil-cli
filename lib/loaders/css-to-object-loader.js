const camelCase = require('camelcase')
const css = require('css')

module.exports = function(cssText) {
  const { stylesheet } = css.parse(cssText)
  const lines = []

  stylesheet.rules.forEach((rule) => {
    const { type, selectors, declarations } = rule

    if (type !== 'rule') {
      return
    }

    const declares = {}
    declarations.forEach((declaration) => {
      // TODO: keyframes https://github.com/tienphaw/react-native-easing-keyframes
      if (declaration.type !== 'declaration') {
        return
      }

      const { property, value } = declaration
      const key = camelCase(property)

      declares[key] = value
    })

    selectors.forEach((selector) => {
      const name = camelCase(selector)
      lines.push(`export const ${name} = ${JSON.stringify(declares)}`)
    })
  })

  const contents = lines.join('\n')
  return contents
}
