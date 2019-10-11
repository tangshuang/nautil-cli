const path = require('path')
const merge = require('webpack-merge')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

const env = process.env.NODE_ENV
const basicConfig = require('./basic.config')

const rootDir = process.cwd()
const srcDir = path.resolve(rootDir, 'src/native')
const distDir = path.resolve(rootDir, 'react-native')

const cssLoaders = [
  'nautil-cli/css-object-loader',
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
  },
  module: {
    rules: [
      {
        test: /\.(jsx|js)$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-react',
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
  // SHOULD MUST HERE
  externals: {
    'react': true,
    'react-native': true,
  },
}

const config = merge(basicConfig, customConfig)

// DONT CLEAN DIR
config.plugins.forEach((plugin, i) => {
  if (plugin instanceof CleanWebpackPlugin) {
    config.plugins.splice(i, 1)
  }
})

module.exports = config
