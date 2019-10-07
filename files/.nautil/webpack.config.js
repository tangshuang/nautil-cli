const path = require('path')
const webpack = require('webpack')

// files in this list should be es6 module and will be transform by babel
const rootDir = path.resolve(__dirname, '..')
const includeFiles = [
  path.resolve(rootDir),
  path.resolve(rootDir, 'node_modules/nautil'),
  path.resolve(rootDir, 'node_modules/ts-fns/src'),
  path.resolve(rootDir, 'node_modules/storagex/src'),
  path.resolve(rootDir, 'node_modules/tyshemo/src'),
  path.resolve(rootDir, 'node_modules/rxjs/_esm2015'),
]

module.exports = {
  mode: 'none',
  output: {
    filename: 'index.js',
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
  module: {
    rules: [
      {
        test: /\.(jsx|js)$/,
        loader: 'babel-loader',
        include: includeFiles,
        options: {
          presets: [
            ['@babel/preset-env', {
              modules: false,
              // exclude: ['@babel/plugin-transform-classes'],
            }],
            '@babel/preset-react',
          ],
          plugins: [
            'react-require',
            '@babel/plugin-proposal-class-properties',
          ],
        },
      },
    ],
  },
  optimization: {
    minimize: false,
    usedExports: true,
    sideEffects: true,
  },
  devtool: 'source-map',
  devServer: {
    // contentBase: __dirname,
    compress: true,
    port: 9000,
    historyApiFallback: true,
    before(app, server) {},
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
  ],
}
