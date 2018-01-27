const zlib = require('zlib')
const http = require('http')
const https = require('https')
const config = require('./config')
const cache = require('./cache')
const logger = require('./logger')

function isContentValid (body) {
  let blacklist = config.contentBlacklist
  if (!blacklist.length) {
    return true
  }
  return blacklist.every(s => body.indexOf(s) === -1)
}

function handleResponse (request, result) {
  let { statusCode } = result

  // not modified
  if (statusCode === 304) {
    return true
  }

  // if result is okay, store in cache, otherwise try things
  if (statusCode === 200 && isContentValid(result.body)) {
    cache.store(request.url, request.method, result)
    return true
  }

  let cacheResult = cache.retrieve(request.url, request.method, true)
  if (cacheResult) {
    logger.info(`Using cached response (${request.url}).Got non-200 response.`)
    Object.assign(result, cacheResult)
    return true
  } else {
    return false
  }
}

// fetch remote url (extract params from request)
function fetch (req) {
  return new Promise((resolve, reject) => {
    let transport = {http, https}
    let headers = Object.assign({}, req.headers)
    let alreadyResolved = false
    let isHttpsTarget = /^https:/.test(config.target)
    let targetPort = parseInt((config.target.match(/:(\d+)/) || [])[1], 10) || (isHttpsTarget ? 443 : 80)
    let targetHostWithPort = config.target.replace(/^https?:\/\//, '').replace(/\/.*/, '')
    let targetHostNoPort = targetHostWithPort.replace(/:\d+\/?$/, '')

    let cacheNotice = (s) => logger.info(`Using cached response (${req.url}). ${s}`)
    let noResponseError = () => new Error(`No response (neither cached, nor live seems to be available - ${req.url}).`)

    if (config.modifyHostHeader) {
      headers.host = targetHostWithPort
    } else {
      delete headers.host
    }

    let options = {
      hostname: targetHostNoPort,
      encoding: null,
      rejectUnauthorized: false,
      port: targetPort,
      path: req.url,
      method: req.method,
      headers
    }
    let body = []

    // if it's possible, get it from the cache
    let cacheResult = cache.retrieve(req.url, req.method)
    if (cacheResult) {
      cacheNotice('Simple use case.')
      resolve(cacheResult)
      return
    }

    // ----

    // wait a bit, maybe the server will respond in time, but if not, then try to do smg
    setTimeout(() => {
      if (alreadyResolved) {
        return
      }
      let cacheResult = cache.retrieve(req.url, req.method, true) // it may have arrived in the meantime
      if (cacheResult) {
        cacheNotice('Timeout reached.')
        resolve(cacheResult)
        alreadyResolved = true
      }
    }, config.maxWaitTime)

    // ----

    // TODO http.request is not working, why?
    let trans = transport[isHttpsTarget ? 'https' : 'http']
    let httpRequest = trans.get(options, (res) => {
      res.on('data', (chunk) => body.push(chunk))
      res.on('end', () => {
        if (alreadyResolved) { // not okay, but we won't care, throw away the response TODO store it if it's okay?
          return
        }

        body = Buffer.concat(body) // do NOT .toString it, would corrupt images of course
        let result = {
          statusCode: res.statusCode,
          headers: res.headers,
          body
        }

        let isZip = /^g?zip$/.test(res.headers['content-encoding'] || '')
        let isNotChanged = res.statusCode === 304

        // if the response is gzipped, unpack it and store the unpacked one
        // (we can handle it better in the future, should we need an interceptor)
        if (isZip && !isNotChanged) {
          zlib.unzip(body, (err, unzipped) => {
            if (err) {
              logger.error(err)
              reject(new Error('Could not unzip response.'))
              return
            }
            result.body = unzipped
            if (handleResponse(req, result)) {
              resolve(result)
              alreadyResolved = true
            } else {
              reject(noResponseError())
            }
          })
          return
        }

        // non gzipped generic response
        if (handleResponse(req, result)) {
          alreadyResolved = true
          resolve(result)
        } else {
          reject(noResponseError())
        }
      })
    })
    httpRequest.on('error', reject)
  })
} // end fetch

module.exports = fetch
