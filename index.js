#!/usr/bin/env node

const commander = require('commander')
const shell = require('shelljs')
const path = require('path')
const camelCase = require('camelcase')

const { copy, exists, readJSON, writeJSON } = require('./utils/file')

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
    if (!name) {
      console.error('Please give a project name.')
      shell.exit(1)
      return
    }

    const files = path.resolve(__dirname, 'files') + '/.'
    const target = path.resolve(cwd)

    copy(files, target, true)

    const pkgfile = path.resolve(target, 'package.json')
    const json = readJSON(pkgfile)
    json.name = name
    writeJSON(pkgfile, json)

    shell.cd(cwd)
    shell.exec('npm i')
    shell.exec('git init')

    shell.exec('npm i -D nautil-cli')

    // generate react-native files
    if (options.native) {
      shell.exec('nautil-cli init-native')
    }

    shell.exit(0)
  })

commander
  .command('init-native')
  .action(function() {
    const pkgfile = path.resolve(target, 'package.json')
    const json = readJSON(pkgfile)
    const { name } = json
    const dirname = camelCase(name, { pascalCase: true })
    shell.cd(path.resolve(cwd, 'src'))
    shell.exec(`react-native init ${dirname}`)
    shell.exec(`cp -f native/. ${dirname}/`)
    shell.exec(`rm -rf native`)
    shell.exec(`mv ${dirname} native`)
    shell.cd(cwd)
    shell.exec(`touch .nautil/native`)
    shell.exit(0)
  })

commander
  .command('build <target>')
  .option('-e, --env', 'production|development')
  .option('-p, --platform', 'ios|andriod')
  .action(function(target, options) {
    const { env = 'production', platform = 'ios' } = options

    if (target === 'native') {
      if (!exists(path.resolve(cwd, '.nautil/native'))) {
        console.error('native not generated. run `npx nautil-cli init-native` first.')
        shell.exit(1)
        return
      }

      shell.cd(path.resolve(cwd, 'src/native'))
      const assetsDir = JSON.stringify(path.resolve(cwd, 'dist/native/assets'))
      const bundlePath = JSON.stringify(path.resolve(cwd, 'dist/native/app.bundle'))
      shell.exec(`rm -rf ${bundlePath}`)
      shell.exec(`rm -rf ${assetsDir}`)
      shell.exec(`mkdir ${assetsDir}`)
      shell.exec(`react-native bundle --entry-file=index.js --platform=${platform} --dev=false --minify=true --bundle-output=${bundlePath} --assets-dest=${assetsDir}`)
      shell.exit(0)
      return
    }

    const configFile = path.resolve(cwd, '.nautil', target + '.js')

    if (!exists(configFile)) {
      console.error(`${configFile} is not existing.`)
      shell.exit(1)
      return
    }

    const config = require(configFile)
    const outpath = config.output.path
    const outdir = path.resolve(outpath, '..')

    shell.exec(`rm -rf ${JSON.stringify(outdir)}`)
    shell.cd(cwd)
    shell.exec(`cross-env NODE_ENV=${env} webpack --config=${JSON.stringify(configFile)}`)

    if (!exists(outdir)) {
      shell.exit(1)
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

commander
  .command('dev <target>')
  .option('-e, --env', 'production|development')
  .option('-p, --platform', 'ios|andriod')
  .action(function(target, options) {
    const { env = 'development', platform = 'ios' } = options

    if (target === 'native') {
      if (!exists(path.resolve(cwd, '.nautil/native'))) {
        console.error('native not generated. run `npx nautil-cli init-native` first.')
        shell.exit(1)
        return
      }

      shell.cd(path.resolve(cwd, 'src/native'))
      shell.exec(`react-native run-${platform}`)
      return
    }

    const configFile = path.resolve(cwd, '.nautil', target + '.js')

    if (!exists(configFile)) {
      console.error(`${configFile} is not existing.`)
      return
    }

    shell.cd(cwd)

    // build to generate dirs/files
    if (target === 'miniapp') {
      shell.exec(`nautil-cli build miniapp`)
    }

    shell.exec(`cross-env NODE_ENV=${env} webpack-dev-server --config=${JSON.stringify(configFile)}`)
  })

commander.parse(process.argv)
