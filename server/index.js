const fs = require('fs')
const http = require('http')
const https = require('https')
const config = require('./config')
const fetch = require('./fetch')
const logger = require('./logger')
const handleControlApi = require('./handle-control-api')

// for some reason plain writeHead refuses to dump all the header items
// so we need to use setHead one by one
function writeHead (res) {
  let { headers } = res
  Object.keys(headers).forEach(key => res.setHeader(key, headers[key]))
  res.writeHead(res.statusCode, res.statusMessage, res.headers)
}

// main http listener
function listener (req, res) {
  // let headers = req.headers;
  let method = req.method
  let url = req.url
  let body = []

  if (config.allowControlUrls && handleControlApi(url, res)) {
    res.end()
    return
  }

  if (config.noFavIcon && url === '/favicon.ico') {
    res.end()
    return
  }

  if (method !== 'GET') {
    logger.error('Not a GET method!')
    res.end()
    return
  }

  req.on('error', (err) => {
    logger.error('Request error', err)
  }).on('data', (chunk) => {
    body.push(chunk)
  }).on('end', () => {
    body = Buffer.concat(body)
    fetch(req)
      .then((remoteResponse) => {
        // TODO we might want to deal with non 200 responses here also
        // since it's possible that we could not come up w anything from the cache
        Object.assign(res, remoteResponse)
        writeHead(res)
        res.end(res.body) // pretty much same as res.write(remoteResponse.body) + res.end()
      })
      .catch((err) => {
        logger.error('Response error', err)
        res.end()
      })
  })
}

logger.info(`Remote target: ${config.target}`)

http.createServer(listener).listen(config.port, () => {
  logger.info(`Listening on ${config.port}`)
})

if (config.httpsKey && config.httpsCert && config.httpsPort) {
  https.createServer({
    key: fs.readFileSync(config.httpsKey),
    cert: fs.readFileSync(config.httpsCert)
  }, listener).listen(config.httpsPort, () => {
    logger.info(`Listening on ${config.httpsPort}`)
  })
}
