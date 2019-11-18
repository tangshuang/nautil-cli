const path = require('path')
const merge = require('webpack-merge')
const { readJSON } = require('../utils/file')
const camelCase = require('camelcase')

const basicConfig = require('./shared/basic-config')

const { jsxLoaders } = require('./rules/jsx')
const { fileLoaders, fileLoaderConfig } = require('./rules/file')

const env = process.env.NODE_ENV
const cwd = process.cwd()

// use the project name as default react-native app name
const pkgfile = path.resolve(cwd, 'package.json')
const json = readJSON(pkgfile)
const AppName = camelCase(json.name, { pascalCase: true })

const srcDir = path.resolve(cwd, 'src/react-native')
const distDir = path.resolve(cwd, AppName)

const customConfig = {
  target: 'web',
  entry: [
    path.resolve(srcDir, 'index.js'),
  ],
  output: {
    path: distDir,
    filename: 'index.js',
    libraryTarget: 'commonjs2',
  },
  module: {
    rules: [
      jsxLoaders,
      fileLoaders,
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

// all files should be convert to be base64
fileLoaderConfig.limit = 1000000000

const config = merge(basicConfig, customConfig)

module.exports = config
