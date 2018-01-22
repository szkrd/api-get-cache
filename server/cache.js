const fs = require('fs')
const path = require('path')
const config = require('./config')
const logger = require('./logger')

const dumpFile = './data/cache.json'
let cache = {}

// store in mem cache
function store (url, method, result) {
  cache[`${url}_${method}`] = {
    timestamp: Date.now(),
    expired: false,
    result
  }
}

// retrieve from mem cache
function retrieve (url, method, desperate) {
  let item = cache[`${url}_${method}`]
  if (!item) {
    return
  }

  let ttlCheckEnabled = config.ttl > -1
  let expired = Date.now() - item.timestamp > config.ttl
  if (ttlCheckEnabled && expired) {
    item.expired = true
  }

  if (!desperate && item.expired) {
    return
  }
  return item.result
}

function flush () {
  Object.keys(cache).forEach(key => delete cache[key])
}

function save () {
  fs.writeFile(dumpFile, JSON.stringify(cache, null, 2), 'utf-8', (err) => {
    if (err) {
      logger.error('File save error', err)
    }
    logger.info(`Cache dumped in "${path.resolve(dumpFile)}"`)
  })
}

function load () {
  fs.readFile(dumpFile, 'utf-8', (err, data) => {
    if (err) {
      logger.error('Cache load error', err)
    }
    try {
      cache = JSON.parse(data + '')
    } catch (err) {
      logger.error('Cache JSON parse error', err)
    }
    logger.info(`Cache restored from "${path.resolve(dumpFile)}", key count is ${Object.keys(cache).length}`)
  })
}

function stat () {
  let keys = Object.keys(cache)
  return keys.length ? `Keys:\n ${keys.join('\n')}` : 'empty\n'
}

module.exports = {
  store,
  retrieve,
  flush,
  save,
  load,
  stat
}
