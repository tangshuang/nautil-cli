#!/usr/bin/env node

const commander = require('commander')
const shell = require('shelljs')
const path = require('path')
const camelCase = require('camelcase')

const { copy, exists, readJSON, writeJSON, read, write, remove, mkdir, scandir } = require('./utils/file')

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
      console.error('Please give a project name.')
      shell.exit(1)
      return
    }

    const files = path.resolve(__dirname, 'files') + '/.'

    shell.exec(`cp -rf ${JSON.stringify(files)} ${JSON.stringify(cwd)}`)

    const pkgfile = path.resolve(cwd, 'package.json')
    const json = readJSON(pkgfile)
    json.name = name
    writeJSON(pkgfile, json)

    shell.cd(cwd)
    shell.exec('npm i')
    shell.exec('git init')
    shell.cp('env', '.env')
    shell.cp('gitignore', '.gitignore')

    shell.exec('npm i -D nautil-cli --verbose')

    // generate react-native files
    if (options.native) {
      shell.exec('nautil-cli init-native')
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
    shell.exec(`npm i -D react-native-cli`)
    shell.exec(`react-native init ${appname}`)
    shell.exec(`mv ${appname} react-native`)

    const indexfile = path.resolve(cwd, 'src/native/index.js')
    const indexcontent = read(indexfile)
    const indexnewcontent = indexcontent.replace('@@APP_NAME@@', appname)
    write(indexfile, indexnewcontent)

    remove(path.resolve(cwd, 'react-native/App.js'))
    remove(path.resolve(cwd, 'react-native/index.js'))

    // const srcDir = path.resolve(cwd, 'src')
    // const indexFile = path.resolve(srcDir, 'native/index.js')
    // shell.ln('-sf', srcDir, path.resolve(cwd, 'react-native/src'))
    // shell.ln('-sf', indexFile, path.resolve(cwd, 'react-native/index.js'))

    shell.exit(0)
  })

commander
  .command('build <target>')
  .option('-e, --env', 'production|development')
  .option('-p, --platform', 'ios|andriod')
  .action(function(target, options) {
    if (target === 'native' && !exists(path.resolve(cwd, 'react-native'))) {
      console.error('Native not generated. Run `npx nautil-cli init-native` first.')
      shell.exit(1)
      return
    }

    const { env = 'production', platform = 'ios' } = options
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
    else if (target === 'native') {
      const assetsDir = JSON.stringify(path.resolve(cwd, 'dist/native/assets'))
      const bundlePath = JSON.stringify(path.resolve(cwd, 'dist/native/app.bundle'))

      remove(path.resolve(cwd, 'dist/native'))
      mkdir(path.resolve(cwd, 'dist/native'))
      mkdir(assetsDir)

      shell.cd(path.resolve(cwd, 'react-native'))
      shell.exec(`react-native bundle --entry-file=index.js --platform=${platform} --dev=false --minify=true --bundle-output=${bundlePath} --assets-dest=${assetsDir}`)
    }
  })

commander
  .command('dev <target>')
  .option('-e, --env', 'production|development')
  .option('-p, --platform', 'ios|andriod')
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
      return
    }

    shell.cd(cwd)

    // build to generate dirs/files
    if (target === 'miniapp') {
      shell.exec(`nautil-cli build miniapp`)
    }

    if (target === 'native') {
      shell.cd(path.resolve(cwd, 'react-native'))
      shell.exec(`react-native run-${platform}`, { async: true }, function(code, stdout, stderr) {
        console.log('Exit code:', code);
        console.log('Program output:', stdout);
        console.error('Program stderr:', stderr);
      })
      shell.cd(cwd)
    }

    shell.exec(`cross-env NODE_ENV=${env} webpack-dev-server --config=${JSON.stringify(configFile)}`)
  })

commander.parse(process.argv)
