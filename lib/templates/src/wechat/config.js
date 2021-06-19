// 生成app.config.json, project.config.json等配置
// appid 通过.env文件来配置，避免泄露

module.exports = function() {
  return {
    app: {
      window:{
        backgroundTextStyle: 'light',
        navigationBarBackgroundColor: '#fff',
        navigationBarTitleText: 'Weixin',
        navigationBarTextStyle: 'black',
      },
      sitemapLocation: 'sitemap.json',
    },
    pages: [
      '$index',
    ],
    project: {
      compileType: 'miniprogram',
      libVersion: '2.7.1',
      appId: process.env.WECHAT_MINIPROGRAM_APP_ID,
      setting: {
        urlCheck: true,
        es6: true,
        enhance: false,
        postcss: true,
        preloadBackgroundData: false,
        minified: true,
        newFeature: false,
        coverView: true,
        nodeModules: true,
        autoAudits: false,
        showShadowRootInWxmlPanel: true,
        scopeDataCheck: false,
        uglifyFileName: false,
        checkInvalidKey: true,
        checkSiteMap: true,
        uploadWithSourceMap: true,
        compileHotReLoad: false,
        useMultiFrameRuntime: false,
        useApiHook: true,
        babelSetting: {
          ignore: [],
          disablePlugins: [],
          outputPath: '',
        },
        enableEngineNative: false,
        bundle: false,
        useIsolateContext: true,
        useCompilerModule: true,
        userConfirmedUseCompilerModuleSwitch: false,
        userConfirmedBundleSwitch: false,
        packNpmManually: false,
        packNpmRelationList: [],
        minifyWXSS: true,
      },
    },
    sitemap: {
      rules: [
        {
          action: 'allow',
          page: '*',
        },
      ],
    },
  }
}
