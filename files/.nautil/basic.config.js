
const { DefinePlugin } = require('webpack')

module.exports = {
  output: {
    globalObject: 'typeof global !== undefined ? global : typeof self !== undefined ? self : typeof window !== undefined ? window : this',
  },
  resolve: {
    alias: {
      // use es6 source code for tree shaking
      'ts-fns': 'ts-fns/src/index.js',
      'storagex': 'storagex/src/storagex.js',
      'tyshemo': 'tyshemo/src/index.js',
      'rxjs': 'rxjs/_esm2015/index.js',
    },
  },
  optimization: {
    minimize: false,
    usedExports: true,
    sideEffects: true,
  },
  devtool: 'source-map',
  devServer: {
    compress: true,
    port: 9000,
    historyApiFallback: true,
  },
  plugins: [
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
  ],
}
