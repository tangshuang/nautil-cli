const commander = require('commander')
const path = require('path')
const chalk = require('chalk')
const shell = require('shelljs')
const camelCase = require('camelcase')
const { exists, readJSON, writeJSON, scandir, read, append, write, mkdir, copy, move } = require('./utils/file')
const { isOneInArray } = require('./utils/utils')
const { extend, formatDate } = require('ts-fns')
const inquirer = require('inquirer')
const cwd = process.cwd()
const pkgJson = require('../package.json')

const TEMPLATES_DIR = path.resolve(__dirname, './templates')
const CLI_VERSION = pkgJson.version

const collectBy = (items) => {
  const { init, lazy } = readJSON(path.join(__dirname, 'package.json'))
  lazy.forEach((item) => {
    const { platforms, ...meta } = item
    if (isOneInArray(items, platforms)) {
      extend(init, meta)
    }
  })
  return init
}

const pkg = require('../package.json')
const { version, name } = pkg
commander.name(name).version(version)

/**
 * check whether the cli version is the version when the project generated
 */
const rcfile = path.resolve(cwd, '.nautil/cli-config.json')
if (exists(rcfile)) {
  const info = readJSON(rcfile)
  if (info.version !== version) {
    console.log(chalk.red(`Your nautil-cli is version ${version} which is not match required version ${info.version}`))
    shell.exit(1)
  }
}

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
        console.log(chalk.yellow('Exit because you are initializing in a directory not empty.'))
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
              name: 'Native',
              value: 'native',
            },
            {
              name: 'Web Component',
              value: 'web-component',
            },
            {
              name: 'SSR',
              value: 'ssr',
            },
            {
              name: 'Wechat Miniprogram',
              vlaue: 'wechat-miniprogram',
            },
          ],
          validate(platforms) {
            return !!platforms.length
          },
        },
      ]).then(({ name, platforms }) => {
        const bakDir = path.resolve(cwd, '.bak-' + formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'))

        // cli-config.json
        const cliConfigDir = path.resolve(cwd, '.nautil')
        if (exists(cliConfigDir)) {
          move(cliConfigDir, path.resolve(bakDir, '.nautil'))
        }
        mkdir(cliConfigDir)
        writeJSON(path.resolve(cliConfigDir, 'cli-config.json'), {
          version: CLI_VERSION,
        })

        // generate package.json
        const pkgFile = path.resolve(cwd, 'package.json')
        if (exists(pkgFile)) {
          move(pkgFile, path.resolve(bakDir, 'package.json'))
        }
        writeJSON(pkgFile, { name, ...collectBy(platforms) })

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
          const AppName = camelCase(name, { pascalCase: true })
          cmds.push(`cd "${cwd}" && react-native init ${AppName}`)

          const { dependencies, devDependencies } = collectBy(['native'])
          const deps = Object.entries(dependencies).map(([key, value]) => `${key}@${value}`)
          const devDeps = Object.entries(devDependencies).map(([key, value]) => `${key}@${value}`)
          cmds.push(`cd "${path.resolve(cwd, AppName)}" && npm i -S ${deps.join(' ')} && npm i -D ${devDeps.join(' ')}`)

          // install dependencies on macOS
          if (process.platform === 'darwin') {
            cmds.push(`cd "${path.resolve(cwd, AppName, 'ios')}" && pod install`)
          }
        }

        if (cmds.length) {
          cmds.forEach((cmd) => shell.exec(cmd))
        }

        shell.exit(0)
      })
    })
  })

commander
  .command('install <pkgs...>')
  .description('Install packages into nautil-cli, always used in global installed version.')
  .action(function(pkgs) {
    const items = []

    pkgs.forEach((pkg) => {
      if (pkg[0] === '+') {
        const platform = pkg.substr(1)
        const { lazy } = readJSON(path.resolve(__dirname, 'package.json'))
        lazy.forEach((info) => {
          if (isOneInArray(info.platforms, [platform]) && info.devDependencies) {
            const deps = Object.entries(info.devDependencies).map(([key, value]) => `${key}@${value}`)
            items.push(...deps)
          }
        })
      }
      else {
        items.push(pkg)
      }
    })

    shell.cd(path.resolve(__dirname, '..'))
    shell.exec(`npm i ${items.join(' ')}`)
  })

commander
  .command('build <platform>')
  .description('Build an nautil application.')
  .action(function(platform) {
    const dir = path.resolve(__dirname, 'tasks', platform)
    if (!exists(dir)) {
      console.log(chalk.red(`${platform} is not supported.`))
      shell.exit(1)
    }

    const program = require(path.resolve(dir, 'build.js'))
    program(() => {
      shell.exit(0)
    })
  })

commander
  .command('dev <platform>')
  .description('Serve up a development server for the application.')
  .action(function(platform) {
    const dir = path.resolve(__dirname, 'tasks', platform)
    if (!exists(dir)) {
      console.log(chalk.red(`${platform} is not supported.`))
      shell.exit(1)
    }

    // force NODE_ENV to be development
    process.env.NODE_ENV = 'development'

    // process.on('unhandledRejection', (reason, p) => {
    //   console.log(reason.stack)
    // });

    const program = require(path.resolve(dir, 'dev.js'))
    program(() => {
      shell.exit(0)
    })
  })

commander.parse(process.argv)
