# Nautil CLI

A CLI tool for [Nautil](https://github.com/tangshuang/nautil) app.

## Usage

**init**

To create a new project.

```
nautil-cli init [app-name] [--native]
```

- app-name: the project name of react-native
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
nautil-cli build <target> [--runtime=dom] [--platform=ios] [--env=development]
```

- target: required, the filename in `.nautil` to use as webpack config file, i.e. `nautil-cli build doc --runtime=dom` will use `.nautil/doc.js` as config file
- runtime: dom|web-component|wechat-mp|native|ssr|ssr-client, if not passed, use the value of *target* as default
- platform: dom|ios|android, defualt is `dom`
- env: for webpack mode option and process.env.NODE_ENV

Notice: when you create a custom config file in .nautil dir, you should remember to pass `--runtime`.

**dev**

To set up a local server and preview code effects.

```
nautil-cli dev <target> [--runtime=dom] [--platform=ios|andriod] [--env=development|production]
```

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
## whether to disable hot-reload module,
## only works when NODE_ENV=development && RUNTIME_ENV=dom
# NO_HOT_RELOAD=true

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
const { ModuleReplacePlugin } = require('nautil-cli/plugins')

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
const { ModuleModifyPlugin } = require('nautil-cli/plugins')

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
const { FilesFilterPlugin } = require('nautil-cli/plugins')

module.exports = {
  ...
  plugins: [
    new FilesFilterPlugin(filter)
  ]
}
```

- filter: function, receive output chunk file path, return true to keep, return false to remove
