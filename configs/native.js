const path = require('path')
const merge = require('webpack-merge')

const env = process.env.NODE_ENV
const basicConfig = require('./basic.config')
const babelLoaderConfig = require('./babel-loader.config')

const rootDir = process.cwd()
const srcDir = path.resolve(rootDir, 'src/native')
const distDir = path.resolve(rootDir, 'react-native')

const cssLoaders = [
  'react-native-css-loader',
]
const lessLoaders = [
  ...cssLoaders,
  'less-loader',
]

const customConfig = {
  target: 'web',
  entry: path.resolve(srcDir, 'index.js'),
  output: {
    path: distDir,
    filename: 'index.js',
    libraryTarget: 'commonjs2',
  },
  resolve: {
    alias: {
      'nautil/components': 'nautil/native-components',
    },
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
        use: cssLoaders,
      },
      {
        test: /\.less$/,
        use: lessLoaders,
      },
    ],
  },
  devServer: {
    writeToDisk: true,
    hot: false,
    inline: false,
    liveReload: false,
  },
  externals: {
    'react-native': true,
    'react': true,
  },
}

const config = merge(basicConfig, customConfig)

module.exports = config
