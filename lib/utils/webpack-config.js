const HtmlPlugin = require('html-webpack-plugin')
const { DefinePlugin } = require('webpack')
const ModuleModifyPlugin = require('../plugins/module-modify-webpack-plugin')
const SpeedMeasureWebpack5Plugin = require('speed-measure-webpack5-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const { merge } = require('webpack-merge')
const path = require('path')

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

function injectPolyfilPlugin(index) {
  return new ModuleModifyPlugin(
    request => request === index,
    content => 'import "core-js";\nimport "regenerator-runtime/runtime";\n' + content,
  )
}

function analysis(config, source) {
  const cwd = process.cwd()
  const sm = new SpeedMeasureWebpack5Plugin()
  return sm.wrap(merge(config, {
    plugins: [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: path.resolve(cwd, '.analyer', source, 'index.html'),
        generateStatsFile: true,
        statsFilename: path.resolve(cwd, '.analyer', source, 'stats.json'),
      }),
    ],
  }))
}

module.exports = {
  replaceHtmlConfig,
  replaceEntry,
  replaceOutput,
  replaceDefineConfig,
  injectPolyfilPlugin,
  analysis,
}
