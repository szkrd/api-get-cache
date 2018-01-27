const http = require('http')
const https = require('https')
const { URL } = require('url')
const config = require('./config')
const { writeHead } = require('./utils')
let parsedUrl = new URL(config.target)

function pipe (req, res) {
  let transport = parsedUrl.protocol === 'https:' ? https : http
  let connector = transport.request({
    host: parsedUrl.hostname,
    port: parsedUrl.port,
    path: req.url,
    method: req.method,
    headers: req.headers
  }, (remoteRes) => {
    writeHead(remoteRes, res)
    remoteRes.pipe(res)
  })
  req.pipe(connector)
}

module.exports = pipe
