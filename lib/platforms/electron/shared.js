const chalk = require('chalk')

function fallIntoError(err, stats) {
  if (err) {
    console.error(chalk.red(err.stack || err))
  }

  const info = stats.toJson()

  if (stats.hasErrors()) {
    info.errors.forEach((error) => {
      console.error(chalk.red(error.message))
    })
  }

  if (stats.hasWarnings()) {
    info.warnings.forEach((warning) => {
      console.error(chalk.yellow(warning.message))
    })
  }

  if (err || stats.hasErrors()) {
    shell.exit(1)
  }
}

function createMainConfig(mainFile, distDir) {
  return {
    target: 'node',
    entry: mainFile,
    output: {
      path: distDir,
      filename: 'main.js',
    },
    externals: [
      function({ context, request }, callback) {
        if (/^\.\.?\//.test(request) || request[0] === '/') {
          return callback()
        }
        return callback(null, 'commonjs2 ' + request)
      },
    ],
    node: {
      global: false,
      __filename: false,
      __dirname: false,
    },
    devtool: false,
  }
}

module.exports = {
  fallIntoError,
  createMainConfig,
}
