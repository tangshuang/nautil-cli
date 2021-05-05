// find out dependencies
const getPackageDependencies = (name, dependencies = {}) => {
  try {
    const deps = require(name + '/package.json').dependencies
    if (!deps) {
      return dependencies
    }

    const keys = Object.keys(deps)
    keys.forEach((key) => {
      if (dependencies[key]) {
        return
      }
      dependencies[key] = true
      getPackageDependencies(key, dependencies)
    })
  }
  catch (e) {}

  dependencies[name] = true
  return dependencies
}

module.exports = function() {
  const nautilDeps = getPackageDependencies('nautil')
  const reactDeps = getPackageDependencies('react')
  const env = process.env.NODE_ENV
  const HASH = env === 'development' ? 'hash' : 'contenthash'

  return {
    optimization: {
      moduleIds: 'deterministic',
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 0,
        cacheGroups: {
          defaultVendors: {
            test: /node_modules/,
            name(module) {
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1]
              const [pkg, ver] = packageName.split('@')
              if (pkg.indexOf('react') === 0 || reactDeps[pkg] || pkg === 'scheduler') {
                return `react-vendors`
              }
              else if (nautilDeps[pkg]) {
                return `nautil-vendors`
              }
              else {
                return `vendors`
              }
            },
            filename: `[name].[${HASH}].js`,
          },
          commons: {
            test(module) {
              return !/node_modules/.test(module.context)
            },
            name: 'main',
            filename: `[name].[${HASH}].js`,
          },
        },
      },
    },
  }
}
