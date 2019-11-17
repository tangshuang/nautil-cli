// https://github.com/wechat-miniprogram/kbone/blob/develop/docs/quickstart.md
// https://github.com/wechat-miniprogram/kbone/blob/develop/docs/miniprogram.config.js

module.exports = {
  // 页面 origin，默认是 https://miniprogram.default
  origin: 'https://domain.com',
  // 入口页面路由，默认是 /
  entry: '/',
  // 页面路由，用于页面间跳转
  router: {
    // 路由可以是多个值，支持动态路由
    home: [
      // 使用正则表达式的字符串形式，会被传入 new RegExp 中
      '(home|index)?',
    ],
  },
  // app 配置，同 https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#window
  app: {
    navigationBarTitleText: 'Nautil Demo',
  },
  // 全局配置
  global: {
    loadingText: '拼命加载页面中...', // 页面加载时是否需要 loading 提示，默认是没有，即空串
  },
  // 项目配置，会被合并到 project.config.json
  projectConfig: {
    appid: process.env.WECHAT_MINIPROGRAM_APP_ID,
  },
  // 包配置，会被合并到 package.json
  packageConfig: {
    author: 'nautil',
  },
}
