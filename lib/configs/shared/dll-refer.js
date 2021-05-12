const DllReferencePlugin = require('webpack/lib/DllReferencePlugin')
const path = require('path')
const InjectDllHtmlWebpackPlugin = require('../../plugins/inject-dll-html-webpack-plugin')

module.exports = function(manifestDir) {
  const config = {
    plugins: [
      // DllReferencePlugin will read the manifest file at the moment,
      // so we shoul not new the plugin in processing
      new DllReferencePlugin({
        manifest: require(path.resolve(manifestDir, 'react.manifest.json')),
      }),
      new DllReferencePlugin({
        manifest: require(path.resolve(manifestDir, 'nautil.manifest.json')),
      }),
      new InjectDllHtmlWebpackPlugin({
        files: [
          'react.dll.js',
          'nautil.dll.js',
        ],
      }),
    ],
  }

  return config
}
