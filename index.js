#!/usr/bin/env node

const commander = require('commander')
const shell = require('shelljs')
const path = require('path')

const { copy, exists } = require('./utils/file')

const pkg = require('./package.json')
const { version, name } = pkg
const cwd = process.cwd()

commander
  .name(name)
  .version(version)

commander
  .command('init')
  .description('Create an empty nautil application.')
  .action(function(cmd, options) {
    const files = path.resolve(__dirname, 'files') + '/.'
    const target = path.resolve(cwd)

    copy(files, target, true)

    shell.cd(cwd)
    shell.exec('npm i')
    shell.exec('git init')
    shell.exit(0)
  })

commander
  .command('build <target>')
  .option('-e, --env', 'production|development')
  .action(function(target, options) {
    const configFile = path.resolve(cwd, '.nautil', target + '.js')
    const { env = 'production' } = options

    if (!exists(configFile)) {
      console.error(`${configFile} is not existing.`)
      return
    }

    const config = require(configFile)
    const outpath = config.output.path
    const outdir = path.resolve(outpath, '..')

    shell.exec(`rm -rf ${JSON.stringify(outdir)}`)
    shell.cd(cwd)
    shell.exec(`cross-env NODE_ENV=${env} webpack --config=${JSON.stringify(configFile)}`)

    if (!exists(outdir)) {
      shell.exit(0)
      return
    }

    if (target === 'miniapp') {
      shell.cd(outdir)
      shell.exec('npm i')
      shell.exec('rm -rf miniprogram_npm && mkdir miniprogram_npm')
      shell.exec('cp -r node_modules/miniprogram-element/src miniprogram_npm/miniprogram-element')
      shell.exec('cp -r node_modules/miniprogram-render/src miniprogram_npm/miniprogram-render')
    }
  })

// commander
//   .command('watch <target>')
//   .action(function(target) {
//     const compiler = createCompiler(target)
//     const catcher = createCatcher()
//     compiler.watch(catcher)
//   })

// commander
//   .command('serve <target>')
//   .action(function(target) {
//     const compiler = createCompiler(target)
//     const { options } = compiler
//     const { devServer = {} } = options
//     const server = new WebpackDevServer(compiler, devServer)
//     const { port = 3000 } = devServer
//     server.listen(port)
//   })

commander.parse(process.argv)


// function createCompiler(target) {
//   const configfile = path.resolve(cwd, `.nautil/${target}.js`)
//   const generate = generators[target]
//   const config = generate(exists(configfile) ? require(configfile) : {})
//   const compiler = webpack(config)
//   return compiler
// }

// function createCatcher() {
//   return (err, stats) => {
//     let flag = false
//     if (err) {
//       if (err.stack) {
//         console.error(err.stack)
//       }
//       if (err.details) {
//         console.error(err.details)
//       }
//       flag = true
//     }

//     const info = stats.toJson()

//     if (stats.hasErrors()) {
//       Array.from(info.errors).forEach(str => console.error(str))
//       flag = true
//     }

//     if (stats.hasWarnings()) {
//       Array.from(info.warnings).forEach(str => console.error(str))
//       flag = true
//     }

//     if (flag) {
//       shell.exit(1)
//     }
//   }
// }
