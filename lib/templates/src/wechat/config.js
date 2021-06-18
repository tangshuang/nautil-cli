// 生成app.config.json, project.config.json等配置
// appid 通过.env文件来配置，避免泄露

module.exports = function() {
  return {
    window:{
      backgroundTextStyle: 'light',
      navigationBarBackgroundColor: '#fff',
      navigationBarTitleText: 'Weixin',
      navigationBarTextStyle: 'black',
    },
  }
}
