#!/usr/bin/env node

const commander = require('commander')
const shell = require('shelljs')
const path = require('path')
const camelCase = require('camelcase')

const { exists, readJSON, writeJSON, read, write, scandir } = require('./utils/file')

const pkg = require('./package.json')
const { version, name } = pkg
const cwd = process.cwd()

commander
  .name(name)
  .version(version)

commander
  .command('init <name>')
  .description('Create an empty nautil application.')
  .option('-n, --native', 'whether to generate react-native files')
  .action(function(name, options) {
    const currentfiles = scandir(cwd)
    if (currentfiles && currentfiles.length) {
      console.error('Current dir is not empty.')
      shell.exit(1)
      return
    }

    if (!name) {
      name = path.basename(cwd)
      console.error('We will use the dir name as project name: ' + name)
    }

    const files = path.resolve(__dirname, 'files') + '/.'
    shell.exec(`cp -rf ${JSON.stringify(files)} ${JSON.stringify(cwd)}`)

    const pkgfile = path.resolve(cwd, 'package.json')
    const json = readJSON(pkgfile)
    json.name = name
    writeJSON(pkgfile, json)

    shell.cd(cwd)

    shell.cp('env', '.env_sample')
    shell.mv('env', '.env')
    shell.mv('gitignore', '.gitignore')

    shell.exec('git init')
    shell.exec('npm i nautil --verbose')
    shell.exec('npm i -D nautil-cli --verbose')

    // generate react-native files
    if (options.native) {
      shell.exec('npx nautil-cli init-native')
    }

    shell.exit(0)
  })

commander
  .command('init-native')
  .action(function() {
    if (exists(path.resolve(cwd, 'react-native'))) {
      console.error('Native has been generated. Remove `react-native` dir first.')
      shell.exit(1)
      return
    }

    const pkgfile = path.resolve(cwd, 'package.json')
    const json = readJSON(pkgfile)
    const { name } = json
    const appname = camelCase(name, { pascalCase: true })

    shell.cd(cwd)
    shell.exec(`react-native init ${appname}`)
    shell.mv(appname, 'react-native')

    const indexfile = path.resolve(cwd, 'src/native/index.js')
    const indexcontent = read(indexfile)
    const indexnewcontent = indexcontent.replace('@@APP_NAME@@', appname)
    write(indexfile, indexnewcontent)

    shell.exit(0)
  })

commander
  .command('build <target>')
  .option('-e, --env [env]', 'production|development')
  .option('-p, --platform [platform]', 'ios|andriod')
  .option('-c, --clean [clean]', 'remove the output dir before build')
  .action(function(target, options) {
    if (target === 'native' && !exists(path.resolve(cwd, 'react-native'))) {
      console.error('Native not generated. Run `npx nautil-cli init-native` first.')
      shell.exit(1)
      return
    }

    const {
      env = 'production',
      platform = 'ios',
      clean = env === 'production' ? true : false,
    } = options
    const configFile = path.resolve(cwd, '.nautil', target + '.js')

    if (!exists(configFile)) {
      console.error(`${configFile} is not existing.`)
      shell.exit(1)
      return
    }

    const config = require(configFile)
    let distPath = config.output.path

    // miniapp is build into sub common dir
    if (target === 'miniapp') {
      distPath = path.resolve(distPath, '..')
    }

    if (target === 'native') {
      const distFile = config.output.filename
      distPath = path.resolve(distPath, distFile)
    }

    if (clean) {
      shell.rm('-rf', distPath)
    }

    shell.cd(cwd)
    shell.exec(`cross-env NODE_ENV=${env} RUNTIME_ENV=${target} webpack --config=${JSON.stringify(configFile)}`)

    if (!exists(distPath)) {
      console.error(`${distPath} is not existing.`)
      shell.exit(1)
      return
    }

    if (target === 'miniapp') {
      shell.cd(distPath)
      shell.exec('npm i')
      shell.rm('-rf', 'miniprogram_npm')
      shell.mkdir('miniprogram_npm')
      shell.cp('-r', 'node_modules/miniprogram-element/src', 'miniprogram_npm/miniprogram-element')
      shell.cp('-r', 'node_modules/miniprogram-render/src', 'miniprogram_npm/miniprogram-render')
    }
    else if (target === 'native') {
      const assetsDir = JSON.stringify(path.resolve(cwd, 'dist/native/assets'))
      const bundlePath = JSON.stringify(path.resolve(cwd, `dist/native/${platform}.bundle`))

      shell.mkdir('-p', assetsDir)
      shell.cd(path.resolve(cwd, 'react-native'))
      shell.exec(`react-native bundle --entry-file=index.js --platform=${platform} --dev=false --minify=true --bundle-output=${bundlePath} --assets-dest=${assetsDir}`)
    }
  })

commander
  .command('dev <target>')
  .option('-e, --env [env]', 'production|development')
  .option('-p, --platform [platform]', 'ios|andriod')
  .action(function(target, options) {
    if (target === 'native') {
      if (!exists(path.resolve(cwd, 'react-native'))) {
        console.error('Native not generated. Run `npx nautil-cli init-native` first.')
        shell.exit(1)
        return
      }
    }

    const { env = 'development', platform = 'ios' } = options
    const configFile = path.resolve(cwd, '.nautil', target + '.js')

    if (!exists(configFile)) {
      console.error(`${configFile} is not existing.`)
      shell.exit(1)
      return
    }

    if (target === 'ssr') {
      const config = require(configFile)
      const output = config.output
      shell.cd(cwd)
      shell.touch(path.resolve(output.path, output.filename)) // create a empty file first
      shell.exec(`cross-env NODE_ENV=${env} RUNTIME_ENV=${target} webpack --config=${JSON.stringify(configFile)} --watch`, { async: true })
      shell.cd(output.path)
      shell.exec('nodemon ' + output.filename)
      // there is no devServer in ssr config,
      // so it should return before devServer checking
      return
    }

    const config = require(configFile)
    if (!config.devServer) {
      console.error(`config.devServer is not existing in your config options.`)
      shell.exit(1)
      return
    }

    const cmd = `cross-env NODE_ENV=${env} RUNTIME_ENV=${target} webpack-dev-server --config=${JSON.stringify(configFile)}`
    if (target === 'native') {
      shell.echo('===============================\n\n')
      shell.echo('Make sure you have closed all Metro CLI!!')
      shell.echo('\n\n===============================')
      shell.cd(cwd)
      shell.exec(cmd, { async: true })
      shell.cd(path.resolve(cwd, 'react-native'))
      shell.exec(`react-native run-${platform}`)
    }
    else if (target === 'miniapp') {
      shell.cd(cwd)
      // files/dirs should exist before serve up
      shell.exec(`npx nautil-cli build miniapp --env=${env}`)
      shell.exec(cmd)
    }
    else {
      shell.cd(cwd)
      shell.exec(cmd)
    }
  })

commander.parse(process.argv)
