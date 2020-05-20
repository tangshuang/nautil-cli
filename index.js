#!/usr/bin/env node

const commander = require('commander')
const shell = require('shelljs')
const path = require('path')
const camelCase = require('camelcase')
const { exists, readJSON, writeJSON, scandir, read, append, write } = require('./utils/file')
const dotenv = require('dotenv')

const pkg = require('./package.json')
const { version, name } = pkg
const cwd = process.cwd()

dotenv.config()

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
    const hasFiles = currentfiles && currentfiles.length
    const hasPkgFile = exists(path.join(cwd, 'package.json'))

    let appname = name
    if ((!hasFiles && !appname) || (hasFiles && !hasPkgFile && !appname)) {
      appname = path.basename(cwd)
      console.error('We will use the dir name as project name: ' + appname)
    }

    if (hasFiles && !hasPkgFile) {
      // cp package.json
      shell.exec(`cp ${JSON.stringify(path.resolve(__dirname, 'templates/package.json'))} ${JSON.stringify(path.resolve(cwd, 'package.json'))}`)
    }

    if (!hasFiles) {
      // copy files into current dir
      shell.exec(`cp -r ${JSON.stringify(path.resolve(__dirname, 'templates') + '/.')} ${JSON.stringify(cwd)}`)
      shell.cd(cwd)
      // rename temp files
      shell.cp('env', '.env')
      shell.mv('env', '.env_sample')
      shell.mv('gitignore', '.gitignore')
    }
    else {
      // copy .nautil dir
      if (!exists(path.resolve(cwd, '.nautil'))) {
        shell.exec(`cp -r ${JSON.stringify(path.resolve(__dirname, 'templates/.nautil'))} ${JSON.stringify(path.resolve(cwd, '.nautil'))}`)
      }

      shell.cd(cwd)
      // .env
      const envFile = path.join(cwd, '.env')
      const envSource = path.join(__dirname, 'templates/env')
      const envContent = read(envSource)
      if (exists(envFile)) {
        const content = read(envFile)
        if (content.indexOf('NAUTIL-CLI') === -1) {
          append(envFile, '\n\n' + envContent)
        }
      }
      else {
        write(envFile, envContent)
      }
    }

    const pkgfile = path.resolve(cwd, 'package.json')
    const json = readJSON(pkgfile)
    // use appname
    if (!hasFiles || (hasFiles && !hasPkgFile)) {
      json.name = appname
    }
    // append scripts
    const scripts = require(path.join(__dirname, 'templates/package.json')).scripts
    json.scripts = json.scripts || {}
    Object.assign(json.scripts, scripts)
    writeJSON(pkgfile, json)

    if (!hasFiles) {
      shell.exec('git init')
    }

    const verbose = options.verbose ? ' --verbose' : ''
    shell.exec('npm i nautil' + verbose)
    shell.exec('npm i -D nautil-cli' + verbose)

    // generate react-native files
    if (options.reactnative) {
      shell.exec('nautil-cli init-react-native ' + appname)
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
    shell.exec(`react-native init ${AppName}`)

    // install @react-native-community packages
    shell.cd(path.resolve(cwd, AppName))
    const { dependencies } = require('nautil/package.json')
    const pkgs = Object.keys(dependencies)
    const deps = pkgs.filter(item => item.indexOf('@react-native-community/') === 0)
    if (deps.length) {
      shell.echo('Install @react-native-community dependencies...')
      shell.exec(`npm i ` + deps.join(' ') + verbose)
    }

    // install dependencies on macOS
    if (process.platform === 'darwin') {
      shell.exec(`cd ios && pod install`)
    }

    shell.exit(0)
  })

commander
  .command('build <target>')
  .option('-e, --env [env]', 'production|development')
  .option('-r, --runtime [runtime]', 'runtime environment of application, dom|react-native|web-component|wechat-miniprogram|ssr-server|ssr-client')
  .option('-p, --platform [platform]', 'web|service|ios|andriod')
  .option('-c, --clean [clean]', 'remove the output dir before build')
  .action(function(target, options) {
    const {
      env = 'production',
      runtime = target === 'dom-dll' ? 'dom' : target,
      platform = runtime === 'react-native' ? 'ios' : 'web',
      clean = env === 'production' ? true : false,
    } = options

    const buildDll = () => {
      if (!process.env.DLL) {
        return
      }
      if (!exists(path.resolve(cwd, `.nautil/${target}-dll.js`))) {
        return
      }

      shell.echo(`Building DLL...`)
      shell.exec(`nautil-cli build ${target}-dll --env=${env} --runtime=dom --platform=web --clean=${clean}`)
    }

    // ssr is splited into 2 parts, server side and client side, so we will do it automatic inside
    if (runtime === 'ssr') {
      const serverConfigFile = path.resolve(cwd, `.nautil/${target}-server.js`)
      const clientConfigFile = path.resolve(cwd, `.nautil/${target}-client.js`)

      shell.cd(cwd)

      // server side building should come first
      if (exists(serverConfigFile)) {
        shell.echo(`Building SSR: ${target}-server ...`)
        shell.exec(`nautil-cli build ${target}-server --env=${env} --runtime=ssr-server --platform=service --clean=${clean}`)
      }

      // client build should be after server side build,
      // or the dist dir will be remove
      if (exists(clientConfigFile)) {
        buildDll()
        shell.echo(`Building SSR: ${target}-client ...`)
        shell.exec(`nautil-cli build ${target}-client --env=${env} --runtime=ssr-client --platform=web --clean=${clean}`)
      }

      // stop going down
      return
    }

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
      console.error('ReactNative not generated. Run `nautil-cli init-react-native ' + dirname + '` first.')
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
    // TODO alipay-mp

    if (clean && runtime !== 'react-native') {
      shell.rm('-rf', distPath)
    }

    shell.cd(cwd)
    buildDll()
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

    if (runtime === 'react-native') {
      const AppName = path.basename(distPath)
      const assetsDir = JSON.stringify(path.resolve(cwd, `dist/${AppName}/assets`))
      const bundlePath = JSON.stringify(path.resolve(cwd, `dist/${AppName}/${platform}.bundle`))
      shell.mkdir('-p', assetsDir)

      shell.cd(distPath)
      shell.exec(`react-native bundle --entry-file=index.js --platform=${platform} --dev=false --minify=true --bundle-output=${bundlePath} --assets-dest=${assetsDir}`)
    }
  })

commander
  .command('dev <target>')
  .option('-e, --env [env]', 'production|development')
  .option('-r, --runtime [runtime]', 'runtime environment of application dom|react-native|web-component|wechat-miniprogram|ssr-server|ssr-client')
  .option('-p, --platform [platform]', 'web|service|ios|andriod')
  .option('-c, --clean [clean]', 'remove the output dir before build')
  .action(function(target, options) {
    const {
      env = 'development',
      runtime = target === 'dom-dll' ? 'dom' : target,
      platform = runtime === 'react-native' ? 'ios' : 'web',
      clean = env === 'production' ? true : false,
    } = options

    const buildDll = () => {
      if (!process.env.DLL) {
        return
      }
      if (!exists(path.resolve(cwd, `.nautil/${target}-dll.js`))) {
        return
      }

      shell.echo(`Building DLL...`)
      shell.exec(`nautil-cli build ${target}-dll --env=${env} --runtime=dom --platform=web --clean=${clean}`)
    }

    // there is no devServer in ssr config,
    // so it should return before devServer checking
    if (runtime === 'ssr') {
      const serverConfigFile = path.resolve(cwd, `.nautil/${target}-server.js`)
      const clientConfigFile = path.resolve(cwd, `.nautil/${target}-client.js`)

      shell.cd(cwd)

      if (exists(serverConfigFile)) {
        shell.echo('Build ssr files before setup for server...')
        shell.exec(`nautil-cli build ${target}-server --env=${env} --runtime=ssr-server`)
      }

      if (exists(clientConfigFile)) {
        buildDll()
        shell.exec(`cross-env NODE_ENV=${env} RUNTIME_ENV=ssr-client PLATFORM_ENV=${platform} WEBPACK_TARGET_FILE=${JSON.stringify(clientConfigFile)} webpack --config=${JSON.stringify(path.resolve(__dirname, 'webpack.config.js'))} --watch`, { async: true })
      }

      if (exists(serverConfigFile)) {
        shell.exec(`cross-env NODE_ENV=${env} RUNTIME_ENV=ssr PLATFORM_ENV=${platform} WEBPACK_TARGET_FILE=${JSON.stringify(configFile)} webpack --config=${JSON.stringify(path.resolve(__dirname, 'webpack.config.js'))} --watch`, { async: true })
        // server up
        shell.cd(output.path)
        shell.exec('nodemon ' + output.filename)
      }

      // stop going down
      return
    }

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
      console.error('ReactNative not generated. Run `nautil-cli init-react-native ' + dirname + '` first.')
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
      shell.exec(`react-native run-${platform}`)
    }
    else if (runtime === 'wechat-miniprogram') {
      shell.cd(cwd)
      // files/dirs should exist before serve up
      shell.exec(`nautil-cli build ${target} --env=${env} --runtime=wechat-miniprogram`)
      shell.exec(cmd)
    }
    else {
      shell.cd(cwd)
      buildDll()
      shell.exec(cmd)
    }
  })

commander.parse(process.argv)
