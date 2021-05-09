const { exists, write, append } = require('./file')
const path = require('path')
const { formatDate } = require('ts-fns')

function log(content) {
  const cwd = process.cwd()
  const logFile = path.resolve(cwd, '.nautil/cli.log')
  const text = formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss') + ' ' + content + '\n'
  if (!exists) {
    write(logFile, text)
  }
  else {
    append(logFile, text)
  }
}

module.exports = {
  log,
}