// for some reason plain writeHead refuses to dump all the header items
// so we need to use setHead one by one
function writeHead (remoteRes, res) {
  let { headers } = remoteRes
  Object.keys(headers).forEach(key => res.setHeader(key, headers[key]))
  res.writeHead(remoteRes.statusCode, remoteRes.statusMessage, remoteRes.headers)
}

module.exports = {
  writeHead
}
