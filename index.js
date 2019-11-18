#!/usr/bin/env node

const commander = require('commander')
const shell = require('shelljs')
const path = require('path')
const camelCase = require('camelcase')

const { exists, readJSON, writeJSON, scandir } = require('./utils/file')

const pkg = require('./package.json')
const { version, name } = pkg
const cwd = process.cwd()

commander
  .name(name)
  .version(version)

commander
  .command('init [name]')
  .description('Create an empty nautil application.')
  .option('-n, --react-native [reactnative]', 'whether to generate react-native files')
  .option('--verbose [verbose]', 'show debug logs')
  .action(function(name, options) {
    const currentfiles = scandir(cwd)
    if (currentfiles && currentfiles.length) {
      console.error('Current dir is not empty.')
      shell.exit(1)
      return
    }

    let appname = name
    if (!appname) {
      appname = path.basename(cwd)
      console.error('We will use the dir name as project name: ' + appname)
    }

    // copy files into current dir
    shell.exec(`cp -r ${JSON.stringify(path.resolve(__dirname, 'templates') + '/.')} ${JSON.stringify(cwd)}`)
    shell.cd(cwd)
    // rename temp files
    shell.cp('env', '.env')
    shell.mv('env', '.env_sample')
    shell.mv('gitignore', '.gitignore')

    const pkgfile = path.resolve(cwd, 'package.json')
    const json = readJSON(pkgfile)
    json.name = appname
    writeJSON(pkgfile, json)

    const verbose = options.verbose ? ' --verbose' : ''

    shell.exec('git init')
    shell.exec('npm i nautil' + verbose)
    shell.exec('npm i -D core-js@3 regenerator-runtime nautil-cli' + verbose)

    // generate react-native files
    if (options.reactnative) {
      shell.exec('npx nautil-cli init-react-native ' + appname)
    }

    shell.exit(0)
  })

commander
  .command('init-react-native [name]')
  .option('--verbose [verbose]', 'show debug logs')
  .action(function(name, options) {
    if (!name) {
      const pkgfile = path.resolve(cwd, 'package.json')
      const json = readJSON(pkgfile)
      name = json.name

      if (!name) {
        console.error('There is no `name` field in package.json')
        shell.exit(1)
        return
      }
    }

    const AppName = camelCase(name, { pascalCase: true })

    if (exists(path.resolve(cwd, AppName))) {
      console.error(`ReactNative has been generated. Remove ${AppName} dir first.`)
      shell.exit(1)
      return
    }

    const verbose = options.verbose ? ' --verbose' : ''

    shell.cd(cwd)
    shell.exec(`npx react-native init ${AppName}`)

    // install @react-native-community packages
    shell.cd(path.resolve(cwd, AppName))
    const { dependencies } = require(path.resolve(cwd, 'node_modules/nautil/package.json'))
    const pkgs = Object.keys(dependencies)
    const deps = pkgs.filter(item => item.indexOf('@react-native-community') > 0)
    shell.exec(`npm i ` + deps.join(' ') + verbose)

    // install dependencies on macOS
    if (process.platform === 'darwin') {
      shell.exec(`cd ios && pod install`)
    }

    shell.exit(0)
  })

commander
  .command('build <target>')
  .option('-e, --env [env]', 'production|development')
  .option('-r, --runtime [runtime]', 'runtime environment of application, dom|react-native|web-component|wechat-miniprogram|ssr|ssr-client')
  .option('-p, --platform [platform]', 'dom|ios|andriod')
  .option('-c, --clean [clean]', 'remove the output dir before build')
  .action(function(target, options) {
    const {
      env = 'production',
      runtime = target,
      platform = runtime === 'react-native' ? 'ios' : 'dom',
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

    if (runtime === 'react-native' && !exists(distPath)) {
      const dirname = path.basename(distPath)
      console.error('ReactNative not generated. Run `npx nautil-cli init-react-native ' + dirname + '` first.')
      if (!/^[a-zA-Z]+$/.test(dirname)) {
        console.error('Notice: the output.path option in ' + configFile + ' dirname should be camel case.')
      }
      shell.exit(1)
      return
    }

    // miniapp is build into sub common dir
    if (runtime === 'wechat-miniprogram') {
      distPath = path.resolve(distPath, '..')
    }
    // todo: alipay-mp

    if (clean && runtime !== 'react-native') {
      shell.rm('-rf', distPath)
    }

    shell.cd(cwd)
    shell.exec(`cross-env NODE_ENV=${env} RUNTIME_ENV=${runtime} PLATFORM_ENV=${platform} WEBPACK_TARGET_FILE=${JSON.stringify(configFile)} webpack --config=${JSON.stringify(path.resolve(__dirname, 'webpack.config.js'))}`)

    if (!exists(distPath)) {
      console.error(`${distPath} is not existing.`)
      shell.exit(1)
      return
    }

    if (runtime === 'wechat-miniprogram') {
      shell.cd(distPath)
      shell.exec('npm i')
      shell.rm('-rf', 'miniprogram_npm')
      shell.mkdir('miniprogram_npm')
      shell.cp('-r', 'node_modules/miniprogram-element/src', 'miniprogram_npm/miniprogram-element')
      shell.cp('-r', 'node_modules/miniprogram-render/src', 'miniprogram_npm/miniprogram-render')
    }
    else if (runtime === 'react-native') {
      const AppName = path.basename(distPath)
      const assetsDir = JSON.stringify(path.resolve(cwd, `dist/${AppName}/assets`))
      const bundlePath = JSON.stringify(path.resolve(cwd, `dist/${AppName}/${platform}.bundle`))
      shell.mkdir('-p', assetsDir)

      shell.cd(distPath)
      shell.exec(`npx react-native bundle --entry-file=index.js --platform=${platform} --dev=false --minify=true --bundle-output=${bundlePath} --assets-dest=${assetsDir}`)
    }
    else if (runtime === 'ssr') {
      // client build should be after server side build,
      // or the dist dir will be remove
      const clientConfigFile = path.resolve(cwd, '.nautil/ssr-client.js')
      if (exists(clientConfigFile)) {
        shell.echo('building ssr-client ...')
        shell.exec(`cross-env NODE_ENV=${env} RUNTIME_ENV=ssr-client PLATFORM_ENV=${platform} WEBPACK_TARGET_FILE=${JSON.stringify(clientConfigFile)} webpack --config=${JSON.stringify(path.resolve(__dirname, 'webpack.config.js'))}`)
      }
    }
  })

commander
  .command('dev <target>')
  .option('-e, --env [env]', 'production|development')
  .option('-r, --runtime [runtime]', 'runtime environment of application dom|react-native|web-component|wechat-miniprogram|ssr|ssr-client')
  .option('-p, --platform [platform]', 'ios|andriod')
  .option('-c, --clean [clean]', 'remove the output dir before build')
  .action(function(target, options) {
    const {
      env = 'development',
      runtime = target,
      platform = runtime === 'react-native' ? 'ios' : 'dom',
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

    if (runtime === 'react-native' && !exists(distPath)) {
      const dirname = path.basename(distPath)
      console.error('ReactNative not generated. Run `npx nautil-cli init-react-native ' + dirname + '` first.')
      if (!/^[a-zA-Z]+$/.test(dirname)) {
        console.error('Notice: the output.path option in ' + configFile + ' dirname should be camel case.')
      }
      shell.exit(1)
      return
    }

    // clear the dist files
    if (clean && runtime !== 'react-native') {
      // miniapp is build into sub common dir
      if (runtime === 'wechat-miniprogram') {
        distPath = path.resolve(distPath, '..')
      }
      // todo: alipay-mp

      shell.rm('-rf', distPath)
    }

    // there is no devServer in ssr config,
    // so it should return before devServer checking
    if (runtime === 'ssr') {
      const output = config.output

      shell.cd(cwd)

      shell.echo('Build ssr files before setup for server...')
      shell.exec(`npx nautil-cli build ${target} --env=${env} --runtime=ssr`)

      const clientConfigFile = path.resolve(cwd, `.nautil/${target}-client.js`)
      if (exists(clientConfigFile)) {
        shell.exec(`cross-env NODE_ENV=${env} RUNTIME_ENV=ssr-client PLATFORM_ENV=${platform} WEBPACK_TARGET_FILE=${JSON.stringify(clientConfigFile)} webpack --config=${JSON.stringify(path.resolve(__dirname, 'webpack.config.js'))} --watch`, { async: true })
      }
      shell.exec(`cross-env NODE_ENV=${env} RUNTIME_ENV=ssr PLATFORM_ENV=${platform} WEBPACK_TARGET_FILE=${JSON.stringify(configFile)} webpack --config=${JSON.stringify(path.resolve(__dirname, 'webpack.config.js'))} --watch`, { async: true })

      // server up
      shell.cd(output.path)
      shell.exec('nodemon ' + output.filename)
      return
    }

    if (!config.devServer) {
      console.error(`config.devServer is not existing in your config options.`)
      shell.exit(1)
      return
    }

    const cmd = `cross-env NODE_ENV=${env} RUNTIME_ENV=${runtime} PLATFORM_ENV=${platform} WEBPACK_TARGET_FILE=${JSON.stringify(configFile)} webpack-dev-server --config=${JSON.stringify(path.resolve(__dirname, 'webpack.config.js'))}`
    if (runtime === 'react-native') {
      shell.echo('===============================\n\n')
      shell.echo('Make sure you have closed all Metro CLI!!')
      shell.echo('\n\n===============================')
      shell.cd(cwd)
      shell.exec(cmd, { async: true })
      shell.cd(distPath)
      shell.exec(`npx react-native run-${platform}`)
    }
    else if (runtime === 'wechat-miniprogram') {
      shell.cd(cwd)
      // files/dirs should exist before serve up
      shell.exec(`npx nautil-cli build ${target} --env=${env} --runtime=wechat-miniprogram`)
      shell.exec(cmd)
    }
    else {
      shell.cd(cwd)
      shell.exec(cmd)
    }
  })

commander.parse(process.argv)
