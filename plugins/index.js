const AfterHookPlugin = require('./after-hook-webpack-plugin')
const BeforeHookPlugin = require('./before-hook-webpack-plugin')
const FilesFilterPlugin = require('./files-filter-webpack-plugin')
const ModuleModifyPlugin = require('./module-modify-webpack-plugin')
const ModuleReplacePlugin = require('./module-replace-webpack-plugin')

module.exports = {
  AfterHookPlugin,
  BeforeHookPlugin,
  FilesFilterPlugin,
  ModuleModifyPlugin,
  ModuleReplacePlugin,
}
