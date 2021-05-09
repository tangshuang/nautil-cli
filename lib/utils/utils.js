const { merge } = require('ts-fns')

function isOneInArray(items, arr) {
  return items.some(item => arr.includes(item))
}

function isAllInArray(items, arr) {
  return !items.some(item => !arr.includes(item))
}

function filterBy(items, limits) {
  const REG_EXP_MATCHES = /^\/(.*)\/{1}([gimy]{0,4})$/
  return items.filter((item) => {
    return limits.some((exp) => {
      const m = REG_EXP_MATCHES.exec(exp)
      if (m) {
        let regex = exp
        let flags = ''
        regex = m[1]
        if (m.length === 3) {
          flags = m[2]
        }
        if (flags && flags.length) {
          return new RegExp(regex, flags).test(item)
        }
        // No flags...
        return new RegExp(regex).test(item)
      }
      return exp === item
    })
  })
}

function mergeConfigs(configs, env) {
  return configs.env && configs.env[env] ? merge(configs, configs.env[env]) : configs
}

module.exports = {
  isOneInArray,
  isAllInArray,
  mergeConfigs,
}