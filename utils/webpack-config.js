const HtmlPlugin = require('html-webpack-plugin')

/**
 * @param {object} config webpack config
 */
function replaceHtmlConfig(config, options) {
  config.plugins && config.plugins.forEach((plugin, i) => {
    if (plugin instanceof HtmlPlugin) {
      config.plugins[i] = new HtmlPlugin(options)
    }
  })
  return config
}

module.exports = {
  replaceHtmlConfig,
}
