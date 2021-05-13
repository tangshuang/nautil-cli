// https://blog.csdn.net/qihoo_tech/article/details/104809763

const { extname } = require('path')
const CSS_FILE_EXTENSIONS = ['.css', '.scss', '.sass', '.less']

module.exports = () => {
  return {
    visitor: {
      ImportDeclaration(path) {
        const { specifiers, source } = path.node
        const { value } = source
        const [file, query] = value.split('?')
        const items = query ? query.split('&') : []
        const hasGiven = query ? items.some(item => ['css-modules', 'no-css-modules'].includes(item)) : false
        if (!hasGiven && CSS_FILE_EXTENSIONS.includes(extname(file))) {
          source.value = specifiers.length > 0 ? `${file}?${['css-modules', ...items].join('&')}` : `${file}?${['no-css-modules', ...items].join('&')}`
        }
      },
    },
  };
};
