module.exports = {
  plugins: [
    [require.resolve('../lib/plugins/babel-plugin-nautil-import.js'), { platform: 'dom' }]
  ]
}
