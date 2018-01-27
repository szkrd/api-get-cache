const zlib = require('zlib')

// for some reason plain writeHead refuses to dump all the header items
// so we need to use setHead one by one
function writeHead (remoteRes, res) {
  let { headers } = remoteRes
  Object.keys(headers).forEach(key => res.setHeader(key, headers[key]))
  res.writeHead(remoteRes.statusCode, remoteRes.statusMessage, remoteRes.headers)
}

// we won't care about deflate, br or quality, just do the minimum
// and trust that both the browser and the server know what they do
function modifyCompression (req, res) {
  let wasZip = /gzip/.test(res.headers['content-encoding'])
  let acceptEncoding = req.headers['accept-encoding']
  let prefersZip = /gzip/.test(acceptEncoding)

  if (wasZip && prefersZip) {
    res.body = zlib.gzipSync(res.body)
  }
}

module.exports = {
  writeHead,
  modifyCompression
}
