# Nautil CLI

A CLI tool for [Nautil](https://github.com/tangshuang/nautil) app.

## Usage

**init**

To create a new project.

```
nautil-cli init <project_name> [--native]
```

- project_name: the project name of react-native
- native: optional, whether to generate react-native dir

Normally, you should first create an empty directory, and use `npx` to run it.

```
mkdir some
cd some
npx nautil-cli init some-app
```

**build**

To build project to code into bundle files.

```
nautil-cli build <runtime> [--platform=ios|andriod] [--env=development|production]
```

- runtime: dom|web-component|wechat-mp|native|ssr|ssr-client|any custom webpack config filename in `.natuil` dir
- platform: only used for native
- env: for webpack mode option and process.env.NODE_ENV

In the project root file, you can modify package.json file's `scripts` field to use `npm` command more easy.

```
npm run build-web
```

**dev**

To set up a local server and preview code effects.

```
nautil-cli dev <runtime> [--platform=ios|andriod] [--env=development|production]
```

- runtime: web|web-component|wechat-mp|native|ssr custom webpack config filename in `.natuil` dir
- platform: only used for native
- env: for webpack mode option and process.env.NODE_ENV

## Configs

In the project root directory, there is a directory called `.nauitl`.
You can write your own webpack config files here.
Then you can use the file's name for nautil-cli task.

For example, you create a `demo.js` in `.nautil`, and give right configuration of webpack, then you can run:

```
npx nautil-cli build demo --env=production
```

And there are two other files in that dir: dev-server.config.js and wechat-mp.config.js.

- dev-server.config.js: global custom webpack-dev-server configuration for `nautil-cli dev` task
- wechat-mp.config.js: custom wechat miniprogram configuration

That's how nautil-cli works.

## .env

You can put a `.env` file in your project root dir to control build.

```
## whether to use hot-reload module,
## only works when NODE_ENV=development && RUNTIME_ENV=dom
# HOT_RELOAD=true

## whether to disable use css module
## nautil-cli default use css module
# NO_CSS_MODULE=true
```

## process.env

You can use `process.env.ENV_VAR` in your client side code to hold the place, and to replace when build. The available vars:

- NODE_ENV: production|development
- RUNTIME_ENV: web|web-component|wechat-mp|native|ssr
- PLATFORM_ENV: ios|android
- APP_NAME: name of react-native package.json

And the VARS from `.env` will be appended into this list. These vars will be replaced when build.

## tools

To create your own build config file, you can use the tools provided by nautil-cli.

**nautil/configs**

Files in nautil/configs dir can be used as a basic configuration, you can extends the exported configuration to create your own build configuration.

**nautil/configs/rules**

Modify the rules file to change default parsing.

**ModuleReplacePlugin**

Replace the module patch string by using this webpack plugin.

```js
const ModuleReplacePlugin = require('nautil-cli/plugins/module-replace-webpack-plugin')

module.exports = {
  ...
  plugins: [
    new ModuleReplacePlugin({
      find,
      replace,
    })
  ]
}
```

- find: 1. string, the module file path to equal; 2: regexp, the moulde file patch to match; 3: function, receive module file path, return true or false
- replace: string, the new file path to replace old module file path

**ModuleModifyPlugin**

Modify module file content.

```js
const ModuleModifyPlugin = require('nautil-cli/plugins/module-modify-webpack-plugin')

module.exports = {
  ...
  plugins: [
    new ModuleModifyPlugin({
      find,
      replace,
    })
  ]
}
```

- find: the same as ModuleReplacePlugin
- replace: function, receive current content, return new content.

Use it only with text files.

**FilesFilterPlugin**

Filter files of output, useful to output only wanted files.

```js
const FilesFilterPlugin = require('nautil-cli/plugins/files-filter-webpack-plugin')

module.exports = {
  ...
  plugins: [
    new FilesFilterPlugin(filter)
  ]
}
```

- filter: function, receive output chunk file path, return true to keep, return false to remove
