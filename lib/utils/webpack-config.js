const HtmlPlugin = require('html-webpack-plugin')
const { DefinePlugin } = require('webpack')

/**
 * @param {object} config webpack config
 */
function replaceHtmlConfig(config, replace) {
  config.plugins && config.plugins.forEach((plugin, i) => {
    if (plugin instanceof HtmlPlugin) {
      const { options } = plugin
      const newOptions = replace(options)
      config.plugins[i] = new HtmlPlugin(newOptions)
    }
  })
  return config
}

function replaceEntry(config, replace) {
  config.entry.forEach((item, i) => {
    const newEntry = replace(item)
    config.entry.splice(i, 0, newEntry)
  })
  return config
}

function replaceOutput(config, replace) {
  const output = replace(config.output)
  config.output = output
  return config
}

function replaceDefineConfig(config, replace) {
  config.plugins && config.plugins.forEach((plugin, i) => {
    if (plugin instanceof DefinePlugin) {
      const { definitions } = plugin
      const newOptions = replace(definitions)
      config.plugins[i] = new DefinePlugin(newOptions)
    }
  })
  return config
}

module.exports = {
  replaceHtmlConfig,
  replaceEntry,
  replaceOutput,
  replaceDefineConfig,
}
