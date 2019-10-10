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

commander
  .command('dev <target>')
  .option('-e, --env', 'production|development')
  .action(function(target, options) {
    const configFile = path.resolve(cwd, '.nautil', target + '.js')
    const { env = 'production' } = options

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
