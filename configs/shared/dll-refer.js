
const DllReferencePlugin = require('webpack/lib/DllReferencePlugin')
const path = require('path')
const { exists } = require('../../utils/file')
const InjectDllHtmlWebpackPlugin = require('../../plugins/inject-dll-html-webpack-plugin')

module.exports = function(distDir) {
  const plugins = []
  const config = {
    plugins,
  }

  // DllReferencePlugin will read the manifest file at the moment,
  // so we shoul not new the plugin in processing
  if (process.env.DLL && exists(path.resolve(distDir, 'react.manifest.json')) && exists(path.resolve(distDir, 'nautil.manifest.json'))) {
    plugins.push(...[
      new DllReferencePlugin({
        manifest: require(path.resolve(distDir, 'react.manifest.json')),
      }),
      new DllReferencePlugin({
        manifest: require(path.resolve(distDir, 'nautil.manifest.json')),
      }),
      new InjectDllHtmlWebpackPlugin({
        files: [
          'react.dll.js',
          'nautil.dll.js',
        ],
      }),
    ])
  }

  return config
}
