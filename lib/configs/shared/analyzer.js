const path = require('path')
const { merge } = require('webpack-merge')

module.exports = function(config, source) {
  const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
  const SpeedMeasureWebpack5Plugin = require('speed-measure-webpack5-plugin')

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
