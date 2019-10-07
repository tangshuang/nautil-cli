const crypto = require('crypto')

function md5(content, length) {
    var hash = crypto.createHash('md5')
    hash.update(content)
    var hex = hash.digest('hex')
    return hex.substr((32-length)/2, length)
}

module.exports = {
  md5,
}
