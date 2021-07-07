#!/usr/bin/env node

const commander = require('commander')
const path = require('path')
const chalk = require('chalk')
const shell = require('shelljs')
const camelCase = require('camelcase')
const { exists, readJSON, writeJSON, scandir, read, write, mkdir, copy, move, remove } = require('./utils/file')
const { isOneInArray } = require('./utils/utils')
const { extend, formatDate, find } = require('ts-fns')
const inquirer = require('inquirer')
const cwd = process.cwd()
const pkgJson = require('../package.json')
const dotenv = require('dotenv')

dotenv.config()

const TEMPLATES_DIR = path.resolve(__dirname, './templates')
const { name: CLI_NAME, version: CLI_VERSION } = pkgJson

const collectBy = (items, filter, useInit = true) => {
  const { init, lazy } = readJSON(path.join(__dirname, 'package.json'))
  const res = useInit ? init : {}
  lazy.forEach((item) => {
    const { platforms, ...meta } = item
    if (isOneInArray(items, platforms)) {
      if (filter) {
        const info = filter(platforms, meta)
        extend(res, info)
      }
      else {
        extend(res, meta)
      }
    }
  })
  return res
}

const createDeps = (deps) => {
  return Object.entries(deps).map(([key, value]) => `${key}@${value}`)
}

/**
 * check whether the cli version is the version when the project generated
 */
const rcfile = path.resolve(cwd, '.nautil/cli-config.json')
if (exists(rcfile)) {
  const rc = readJSON(rcfile)
  const [rcMajor, rcMinor, rcPatch] = rc.version.split(/\.|-/)
  const rcVer = rcMajor + '.' + rcMinor

  const [cliMajor, cliMinor, cliPatch] = CLI_VERSION.split(/\.|-/)
  const cliVer = cliMajor + '.' + cliMinor

  if (!(rcVer === cliVer && +cliPatch >= +rcPatch)) {
    console.error(chalk.red(`Your nautil-cli is version ${CLI_VERSION} which is not match required version ${rc.version}`))
    shell.exit(1)
  }
}

commander.name(CLI_NAME).version(CLI_VERSION)

commander
  .command('init')
  .description('Initialize an nautil application.')
  .option('--verbose [verbose]', 'show debug logs')
  .action(function(options) {
    inquirer.prompt([
      {
        type: 'confirm',
        name: 'is_override',
        message: 'Project is not empty, do you want to override current directory?',
        default: false,
        when() {
          const currentfiles = scandir(cwd)
          const hasFiles = currentfiles && currentfiles.length
          return hasFiles
        },
      },
    ]).then(({ is_override }) => {
      if (is_override === false) {
        console.warn(chalk.yellow('Exit because you are initializing in a directory not empty.'))
        shell.exit(0)
      }

      return inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Project name, will be used as package name',
          default: path.basename(cwd),
        },
        {
          type: 'checkbox',
          name: 'platforms',
          choices: [
            {
              name: 'DOM',
              value: 'dom',
            },
            {
              name: 'React Native',
              value: 'native',
            },
            {
              name: 'Web Component',
              value: 'web-component',
            },
            {
              name: 'Wechat Miniprogram',
              value: 'wechat',
            },
            {
              name: 'Electron',
              value: 'electron',
            },
          ],
          validate(platforms) {
            return !!platforms.length
          },
        },
        {
          type: 'input',
          name: 'appname',
          message: 'App name, will be used as native directory name.',
          when(answers) {
            const { platforms } = answers
            return isOneInArray(['native', 'electron'], platforms)
          },
        },
      ]).then(({ name, platforms, appname }) => {
        appname = appname || name
        const bakDir = path.resolve(cwd, '.bak-' + formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'))

        // cli-config.json
        const cliConfigDir = path.resolve(cwd, '.nautil')
        if (exists(cliConfigDir)) {
          move(cliConfigDir, path.resolve(bakDir, '.nautil'))
        }
        mkdir(cliConfigDir)
        writeJSON(path.resolve(cliConfigDir, 'cli-config.json'), {
          version: CLI_VERSION,
          platforms,
          typescript: false,
          alias: null,
          dll: false,
          chunks: false,
          define: null,
          clear: false,
          analyer: false,
          sourceMap: true,
          devServer: null,
          hot: false,
          live: true,
          cache: false,
          env: {},
          source: {},
        })

        // generate package.json
        const pkgFile = path.resolve(cwd, 'package.json')
        if (exists(pkgFile)) {
          move(pkgFile, path.resolve(bakDir, 'package.json'))
        }

        const pkgContent = {
          name,
          ...collectBy(platforms, (platforms, meta) => {
            // we will install dependencies later in AppName dir for react native
            if (platforms.length === 1 && platforms[0] === 'native') {
              delete meta.dependencies
            }
            return meta
          }),
        }
        pkgContent.devDependencies['nautil-cli'] = '^' + CLI_VERSION
        writeJSON(pkgFile, pkgContent)

        // copy .env
        write(path.resolve(cwd, '.env_sample'), read(path.resolve(TEMPLATES_DIR, 'env')))

        // copy .gitignore
        const gitIgnoreFile = path.resolve(cwd, '.gitignore')
        if (exists(gitIgnoreFile)) {
          move(gitIgnoreFile, path.resolve(bakDir, '.gitignore'))
        }
        write(gitIgnoreFile, read(path.resolve(TEMPLATES_DIR, 'gitignore')))

        // copy browserslist
        const browserslistFile = path.resolve(cwd, '.browserslistrc')
        if (exists(browserslistFile)) {
          move(browserslistFile, path.resolve(bakDir, '.browserslistrc'))
        }
        write(browserslistFile, read(path.resolve(TEMPLATES_DIR, 'browserslist')))

        const tsConfigFile = path.resolve(cwd, 'tsconfig.json')
        if (exists(tsConfigFile)) {
          move(tsConfigFile, path.resolve(bakDir, 'tsconfig.json'))
        }
        write(tsConfigFile, read(path.resolve(TEMPLATES_DIR, 'tsconfig.json')))

        // copy templates
        const srcDir = path.resolve(cwd, 'src')
        if (exists(srcDir)) {
          move(srcDir, path.resolve(bakDir, 'src'))
        }
        mkdir(srcDir)
        copy(path.resolve(TEMPLATES_DIR, 'src/app'), path.resolve(cwd, 'src'))
        platforms.forEach((name) => {
          copy(path.resolve(TEMPLATES_DIR, 'src', name), path.resolve(cwd, 'src'))
        })

        const cmds = []
        const verbose = options.verbose ? '--verbose' : ''

        shell.exec(`cd "${cwd}" && npm i ${verbose}`)

        // generate react-native files
        if (platforms.includes('native')) {
          const AppName = camelCase(appname, { pascalCase: true })
          cmds.push(`cd "${cwd}" && npx react-native init ${AppName}`)

          const { dependencies } = collectBy(['native'], null, false)
          const deps = createDeps(dependencies)
          cmds.push(`cd "${path.resolve(cwd, AppName)}" && npm i -S ${deps.join(' ')}`)

          // remove(path.resolve(cwd, AppName, 'App.js'))
          writeJSON(path.resolve(cwd, 'src/native', 'config.json'), {
            name: AppName,
          })
        }

        if (platforms.includes('electron')) {
          const AppName = camelCase(appname, { pascalCase: true })
          const configFile = path.resolve(cwd, 'src/electron', 'config.json')
          const configJson = readJSON(configFile)
          configJson.name = AppName
          writeJSON(configFile, configJson)
        }

        if (cmds.length) {
          cmds.forEach((cmd) => shell.exec(cmd))
        }

        shell.exit(0)
      })
    })
  })

commander
  .command('install [pkgs...]')
  .alias('i')
  .description('Install packages into nautil-cli, always used in global installed version.')
  .option('-g, --global [global]', 'install dependencies into global installed nautil-cli (not current project).')
  .option('-f, --force [force]', 'force reinstall dependencies from nautil-cli provided, pkgs... should not be given.')
  .action(function(pkgs, options) {
    const { init, lazy, supports } = readJSON(path.resolve(__dirname, 'package.json'))

    const pushDeps = (items, platform, dev) => {
      const depKey = dev ? 'devDependencies' : 'dependencies'
      lazy.forEach((info) => {
        if (isOneInArray(info.platforms, [platform]) && info[depKey]) {
          const deps = createDeps(info[depKey])
          items.push(...deps)
        }
      })
    }

    if (options.force) {
      if (!exists(rcfile)) {
        console.error(chalk.red(`${rcfile} is not exisiting, --force will reinstall dependencies.`))
        shell.exit(1)
      }

      const rc = readJSON(rcfile)
      const { platforms = [] } = rc

      const { dependencies = {}, devDependencies = {} } = init
      const deps = createDeps(dependencies)
      const devDeps = createDeps(devDependencies)

      platforms.forEach((platform) => {
        pushDeps(deps, platform)
        pushDeps(devDeps, platform, true)
      })

      // make typescript, analyer works
      const supportTypes = Object.keys(supports)
      const supportItems = supportTypes.filter(type => rc[type])
      if (supportItems.length) {
        supportItems.forEach((item) => {
          const deps = createDeps(supports[item])
          devDeps.push(...deps)
        })
      }

      console.warn(chalk.yellow('Hope you know what --force will do.'))
      shell.cd(cwd)
      shell.exec(`npm i ${deps.join(' ')}`)
      shell.exec(`npm i -D ${devDeps.join(' ')}`)
      shell.exit(0)
    }

    if (!pkgs.length) {
      console.error(chalk.red(`pkgs are required, nautil i pkg@version`))
      shell.exit(1)
    }

    const items = []
    pkgs.forEach((pkg) => {
      if (pkg[0] === '+') {
        const platform = pkg.substr(1)
        if (supports[platform]) {
          const peerDependencies = supports[platform]
          const deps = createDeps(peerDependencies)
          items.push(...deps)
        }
        else {
          pushDeps(items, platform, true)
        }
      }
      else {
        items.push(pkg)
      }
    })

    if (options.global) {
      console.warn(chalk.yellow('Hope you know what --global will do.'))
      shell.cd(path.resolve(__dirname, '..'))
      shell.exec(`npm i ${items.join(' ')}`)
      shell.exit(0)
    }

    shell.cd(cwd)
    shell.exec(`npm i -D ${items.join(' ')}`)
    shell.exit(0)
  })

// check supports, if not existing install them
function checkAndInstallSupports() {
  if (!exists(rcfile)) {
    console.error(chalk.red(`${rcfile} is not existing!`))
    shell.exit(1)
  }

  const rc = readJSON(rcfile)
  const { analyzer, typescript } = rc

  const { supports } = readJSON(path.resolve(__dirname, 'package.json'))

  const deps = []

  const pushDeps = (type) => {
    const keys = Object.keys(supports[type])
    keys.forEach((key) => {
      if (!exists(path.resolve(cwd, 'node_modules', key))) {
        deps.push(`${key}@${supports[type][key]}`)
      }
    })
  }

  if (analyzer) {
    pushDeps('analyer')
  }

  if (typescript) {
    pushDeps('typescript')
  }

  if (deps.length) {
    shell.cd(cwd)
    shell.exec(`npm i -D ${deps.join(' ')}`)
  }
}

commander
  .command('build <source>')
  .description('Build an nautil application.')
  .action(function(source) {
    checkAndInstallSupports()

    let platform = source

    const rc = readJSON(rcfile)
    const { source: sourceMapping = {}, typescript } = rc
    const item = find(sourceMapping, (_, key) => key === source)
    if (item && item.platform) {
      platform = item.platform
    }

    const dir = path.resolve(__dirname, 'platforms', platform)
    if (!exists(dir)) {
      console.error(chalk.red(`${platform} is not supported.`))
      shell.exit(1)
    }

    // default production
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production'
    }

    if (typescript) {
      shell.cd(cwd)
      shell.exec('tsc --pretty')
      if (shell.error()) {
        shell.exit(1)
      }
    }

    require(path.resolve(dir, 'build.js'))(source)
  })

commander
  .command('dev <source>')
  .description('Serve up a development server for the application.')
  .action(function(source) {
    checkAndInstallSupports()

    let platform = source

    const rc = readJSON(rcfile)
    const { source: sourceMapping = {}, typescript } = rc
    const item = find(sourceMapping, (_, key) => key === source)
    if (item && item.platform) {
      platform = item.platform
    }

    const dir = path.resolve(__dirname, 'platforms', platform)
    if (!exists(dir)) {
      console.error(chalk.red(`${platform} is not supported.`))
      shell.exit(1)
    }

    // force NODE_ENV to be development
    process.env.NODE_ENV = 'development'

    if (typescript) {
      shell.cd(cwd)
      shell.exec('tsc --watch --pretty --noEmit', { async: true })
    }

    require(path.resolve(dir, 'dev.js'))(source)
  })

commander
  .command('run <appio> [source]')
  .description('Serve up native app.')
  .action(function(appio, source) {
    if (!['ios', 'android', 'electron'].includes(appio)) {
      console.error(chalk.red('appio should only be choosed from ios|android|electron'))
      shell.exit(1)
    }

    const isApp = ['ios', 'android'].includes(appio)
    const isElectron = appio === 'electron'

    source = source || (isApp ? 'native' : isElectron ? 'electron' : '')
    if (!source) {
      console.error(chalk.red('source is required!'))
      shell.exit(1)
    }

    const srcDir = path.resolve(cwd, 'src', source)
    if (!exists(srcDir)) {
      console.error(chalk.red(`${srcDir} is not existing!`))
      shell.exit(1)
    }

    const configFile = path.resolve(srcDir, 'config.json')
    if (!exists(configFile)) {
      console.error(chalk.red(`${configFile} is not existing!`))
      shell.exit(1)
    }

    if (isApp) {
      const { name: AppName } = readJSON(configFile)
      const appDir = path.resolve(cwd, AppName)
      if (!exists(appDir)) {
        console.error(chalk.red(`${appDir} is not existing!`))
        shell.exit(1)
      }

      // build first so that we can preview at the first glance
      shell.cd(cwd)
      shell.exec(`NODE_ENV=development npx nautil build ${source}`)

      shell.cd(appDir)
      shell.exec(`npx react-native run-${appio}`) // react-native run will end after building, we do not need to run it in async task

      shell.cd(cwd)
      shell.exec(`npx nautil dev ${source}`)
    }
    else if (isElectron) {
      let opened = false
      const openElectron = () => {
        const distDir = path.join('dist', source)
        shell.cd(cwd)
        console.log(chalk.blue('Runing electron...'))
        shell.exec(`npx electron ${distDir}`, { async: true })
      }

      shell.cd(cwd)
      const child = shell.exec(`npx nautil dev ${source}`, { async: true })
      child.stdout.on('data', (data) => {
        if (data.toString().indexOf('Compiled ') > -1 && !opened) {
          openElectron()
          opened = true
        }
      })
    }
  })

commander
  .command('pack <appio> [source]')
  .description('Pack native app.')
  .action(function(appio, source) {
    if (!['ios', 'android', 'electron'].includes(appio)) {
      console.error(chalk.red('appio should only be choosed from ios|android|electron'))
      shell.exit(1)
    }

    const isApp = ['ios', 'android'].includes(appio)
    const isElectron = appio === 'electron'

    source = source || (isApp ? 'native' : isElectron ? 'electron' : '')
    if (!source) {
      console.error(chalk.red('source is required!'))
      shell.exit(1)
    }

    const srcDir = path.resolve(cwd, 'src', source)
    if (!exists(srcDir)) {
      console.error(chalk.red(`${srcDir} is not existing!`))
      shell.exit(1)
    }

    const configFile = path.resolve(srcDir, 'config.json')
    if (!exists(configFile)) {
      console.error(chalk.red(`${configFile} is not existing!`))
      shell.exit(1)
    }

    const distDir = path.resolve(cwd, 'dist', source)
    if (isApp) {
      const { name: AppName } = readJSON(configFile)
      const appDir = path.resolve(cwd, AppName)
      if (!exists(appDir)) {
        console.error(chalk.red(`${appDir} is not existing!`))
        shell.exit(1)
      }

      shell.cd(appDir)
      const entryFile = path.resolve(appDir, 'index.js')
      const bundleFile = path.resolve(distDir, 'index.' + appio + '.jsbundle')
      shell.exec(`npx react-native bundle --entry-file="${entryFile}" --platform=${appio} --dev=false --bundle-output="${bundleFile}" --assets-dest="${distDir}"`)
    }
    else if (isElectron) {
      shell.cd(cwd)
      shell.exec(`npx electron-builder --projectDir="${distDir}"`)
    }
  })

commander.parse(process.argv)
