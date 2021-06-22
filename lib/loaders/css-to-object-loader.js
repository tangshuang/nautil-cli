const camelCase = require('camelcase')
const css = require('css')

module.exports = function(cssText) {
  const { stylesheet } = css.parse(cssText)

  // TODO: font-face
  // TODO: media
  // TODO: keyframes https://github.com/tienphaw/react-native-easing-keyframes
  // // preload keyframes, font-face, media
  // const keyframeMapping = {}
  // stylesheet.rules.forEach((rule) => {
  //   const { type, selectors, declarations, keyframes } = rule

  //   if (type === 'keyframes') {
  //     const frames = {}
  //     keyframes.forEach((keyframe) => {
  //       const { type, values, declarations } = keyframe
  //       console.log(values, declarations)
  //     })
  //   }
  // })

  const normalRules = []
  stylesheet.rules.forEach((rule) => {
    const { type, selectors, declarations } = rule

    if (type !== 'rule') {
      return
    }

    const declares = {}
    declarations.forEach((declaration) => {
      if (declaration.type !== 'declaration') {
        return
      }

      const { property, value } = declaration
      const key = camelCase(property)

      // TODO: transition
      declares[key] = value
    })

    selectors.forEach((selector) => {
      const name = camelCase(selector)
      normalRules.push(`export const ${name} = ${JSON.stringify(declares)}`)
    })
  })

  const contents = normalRules.join('\n')
  return contents
}
