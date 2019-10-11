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
nautil-cli build <target> [--platform=ios|andriod] [--env=development|production]
```

- target: web|web-component|miniapp|native|any custom webpack config filename in `.natuil` dir
- platform: only used for native
- env: for webpack mode option and process.env.NODE_ENV

In the project root file, you can modify package.json file's `scripts` field to use `npm` command more easy.

```
npm run build-web
```

**dev**

To set up a local server and preview code effects.

```
nautil-cli dev <target> [--platform=ios|andriod] [--env=development|production]
```

- target: web|web-component|miniapp|native|any custom webpack config filename in `.natuil` dir
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

And there are two other files in that dir: dev-server.config.js and mp.config.js.

- dev-server.config.js: global custom webpack-dev-server configuration for `nautil-cli dev` task
- mp.config.js: custom wechat miniprogram configuration

That's how nautil-cli works.
