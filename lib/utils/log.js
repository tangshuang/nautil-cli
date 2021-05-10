const { exists, write, append } = require('./file')
const path = require('path')
const { formatDate } = require('ts-fns')

function writeLog(content) {
  const cwd = process.cwd()
  const logFile = path.resolve(cwd, '.nautil/cli.log')
  const text = formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss') + ' ' + content + '\n'
  // if (!exists) {
  //   write(logFile, text)
  // }
  // else {
  //   append(logFile, text)
  // }
  write(logFile, text)
}

module.exports = {
  writeLog,
}
