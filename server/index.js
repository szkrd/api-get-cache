const fs = require('fs')
const http = require('http')
const https = require('https')
const config = require('./config')
const fetch = require('./fetch')
const logger = require('./logger')
const handleControlApi = require('./internal-api')
const { writeHead } = require('./utils')
const pipe = require('./pipe')

// main http listener
function listener (req, res) {
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

  // let's not deal with anything other then GETs for now
  if (method !== 'GET') {
    logger.info('Not a GET method, piping only.')
    pipe(req, res)
    return
  }

  // if we want to deal with interceptable POSTs, we will need this body concat, but not now
  req.on('error', (err) => {
    logger.error('Request error', err)
  }).on('data', (chunk) => {
    body.push(chunk)
  }).on('end', () => {
    body = Buffer.concat(body)
    fetch(req)
      .then((remoteRes) => {
        // TODO we might want to deal with non 200 responses here also
        // since it's possible that we could not come up w anything from the cache
        Object.assign(res, remoteRes)
        writeHead(remoteRes, res)
        res.end(res.body) // pretty much same as res.write(remoteResponse.body) + res.end()
      })
      .catch((err) => {
        logger.error('Response error', err)
        res.end()
      })
  })
}

// -----

logger.info(`Remote target: ${config.target}`)

http.createServer(listener)
  .listen(config.port, () => {
    logger.info(`Listening on ${config.port}`)
  })

if (config.httpsKey && config.httpsCert && config.httpsPort) {
  const key = fs.readFileSync(config.httpsKey)
  const cert = fs.readFileSync(config.httpsCert)

  https.createServer({ key, cert }, listener)
    .listen(config.httpsPort, () => {
      logger.info(`Listening on ${config.httpsPort}`)
    })
}
