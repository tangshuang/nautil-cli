/**
 * import('xxx') -> require('xxx')
 */

const t = require('@babel/types')

module.exports = () => {
  return {
    visitor: {
      CallExpression(path) {
        const { callee, arguments } = path.node
        if (callee.type === 'Import') {
          const imported = arguments[0].value
          const requireExp = t.callExpression(t.identifier('require'), [t.stringLiteral(imported)])
          const promiseExp = t.callExpression(
            t.memberExpression(t.identifier('Promise'), t.identifier('resolve')),
            [requireExp],
          )
          const node = t.expressionStatement(promiseExp)
          path.replaceWith(node)
        }
      },
    },
  };
};
