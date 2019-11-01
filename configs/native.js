const path = require('path')
const merge = require('webpack-merge')

const basicConfig = require('./basic.config')

const env = process.env.NODE_ENV
const rootDir = process.cwd()
const srcDir = path.resolve(rootDir, 'src/native')
const distDir = path.resolve(rootDir, 'react-native')

const customConfig = {
  target: 'web',
  entry: path.resolve(srcDir, 'index.js'),
  output: {
    path: distDir,
    filename: 'index.js',
    libraryTarget: 'commonjs2',
  },
  resolve: {
    extensions: ['.native.jsx', '.native.js', '.jsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(jsx|js)$/,
        include: babelLoaderConfig.options.include,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                'module:metro-react-native-babel-preset',
              ],
              plugins: [
                ['transform-class-remove-static-properties', {
                  mode: env === 'production' ? 'remove' : 'wrap',
                }],
                'react-require',
                ['@babel/plugin-proposal-class-properties', {
                  loose: true,
                }],
              ],
            },
          }
        ],
      },
      {
        test: /\.css$/,
        use: [
          'react-native-css-loader',
        ],
      },
      {
        test: /\.less$/,
        use: [
          'react-native-css-loader',
          'less-loader',
        ],
      },
      {
        test: /\.sass$/,
        use: [
          'react-native-css-loader',
          'sass-loader',
        ],
      },
    ],
  },
  devServer: {
    writeToDisk: true,
    hot: false,
    inline: false,
    liveReload: false,
  },
  externals: [
    {
      'react-native': true,
      'react': true,
    },
    (context, request, callback) => {
      if (request.indexOf('@react-native-community') > -1) {
        return callback(null, 'commonjs2 ' + request)
      }
      callback()
    },
  ],
}

const config = merge(basicConfig, customConfig)

module.exports = config
