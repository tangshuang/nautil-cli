// load .env params
require('dotenv').config()

const { WEBPACK_TARGET_FILE } = process.env
const cwd = process.cwd()

const { exists } = require('./utils/file')
const merge = require('webpack-merge')
const path = require('path')

const beforeHookFile = path.resolve(cwd, '.nautil/before.hook.js')
const beforeHook = exists(beforeHookFile) && require(beforeHookFile)
const beforeHookConfig = typeof beforeHook === 'function' ? beforeHook() : {}

const customConfig = require(WEBPACK_TARGET_FILE)
const generatedConfig = merge(beforeHookConfig, customConfig)

const afterHookFile = path.resolve(cwd, '.nautil/after.hook.js')
const afterHook = exists(afterHookFile) && require(afterHookFile)
const afterHookConfig = typeof afterHook === 'function' ? afterHook(generatedConfig) : generatedConfig

module.exports = afterHookConfig
