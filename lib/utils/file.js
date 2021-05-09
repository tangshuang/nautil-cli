const path = require('path')
const fs = require('fs')
const shell = require('shelljs')

function exists(file) {
  if(typeof file !== 'string') return
  return fs.existsSync(file)
}

function isFile(file) {
  if(!exists(file)) return
  return fs.lstatSync(file).isFile()
}

function isDir(dir) {
  if(!exists(dir)) return
  return fs.lstatSync(dir).isDirectory()
}

function isSymLink(file) {
  if(!exists(file)) return
  return fs.lstatSync(file).isSymbolicLink()
}

function read(file) {
  if(!exists(file)) return
  return fs.readFileSync(file).toString()
}

function readJSON(file) {
  if(!exists(file)) return
  return JSON.parse(read(file))
}

function write(file, content) {
  fs.writeFileSync(file, content)
}

function append(file, content) {
  fs.appendFileSync(file, content)
}

function writeJSON(file, json) {
  write(file, JSON.stringify(json, null, 2))
}

function symlink(from, to) {
    if(!exists(from)) return
    fs.symlinkSync(from, to, isDir(from) ? 'dir' : 'file')
}

function unSymlink(symlink) {
  if(!isSymLink(symlink)) return
  remove(symlink)
}

function scandir(dir) {
  if(!exists(dir)) return
  return fs.readdirSync(dir)
}

function clear(dir) {
  if(!exists(dir)) return
  shell.exec('cd ' + dir + ' && rm -rf * && rm -rf .??*')
}

function mkdir(dir) {
  if(exists(dir)) return
  shell.exec(`mkdir -p "${dir}"`)
}

function rename(file, newfile) {
  if(!exists(file)) return
  fs.renameSync(file, newfile)
}

function copy(from, to, force = true) {
  shell.exec(`cp -r${force ? 'f' : ''} "${from}" "${to}"`)
}

function remove(file) {
  var filename = path.basename(file)
  var dirname = path.dirname(file)
  shell.exec(`cd "${dirname}" && rm -rf "${filename}"`)
}

function move(from, to) {
  const dir = path.dirname(to)
  if (!exists(dir)) {
    mkdir(dir)
  }
  shell.exec(`mv -f "${from}" "${to}"`)
}

function getFileExt(file, maxnum = 1) {
  let ext = file.substr(file.lastIndexOf('.'))
  if(maxnum > 1) for(let i = maxnum;i > 1;i --) {
    ext = ext.substr(ext.lastIndexOf('.'))
  }
  return ext
}

/**
 * @param array search: an array to put possible value to find, if the first value not found, the next value will be use, until find a value
 */
function setFileExt(file, ext, search) {
  let last = file.lastIndexOf('.')
  if(search && Array.isArray(search)) for(let reg of search) {
    let found = file.lastIndexOf(reg)
    if(found > -1) {
      last = found
      break
    }
  }
  return file.substr(0, last) + ext
}

module.exports = {
  exists,
  isFile,
  isDir,
  isSymLink,
  read,
  readJSON,
  write,
  writeJSON,
  symlink,
  unSymlink,
  scandir,
  clear,
  remove,
  mkdir,
  rename,
  copy,
  getFileExt,
  setFileExt,
  append,
  move,
}
