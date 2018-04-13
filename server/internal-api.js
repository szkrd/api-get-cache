const urlParser = require('url')
const cache = require('./cache')
const config = require('./config')

// WIP - TODO extract routes
const authLock = res => {
  res.statusCode = 401
  res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"')
  res.write('Needs auth.')
}

const isAllowed = (req, res) => {
  if (config.username && config.password) {
    let auth = req.headers['authorization']
    if (!auth) {
      authLock(res)
      return false
    } else {
      let buffer = Buffer.from(auth.split(' ')[1], 'base64').toString()
      let secret = buffer.split(':')
      if (secret[0] !== config.username || secret[1] !== config.password) {
        authLock(res)
        return false
      }
    }
  }
  return true
}

module.exports = function handleControlApi (req, res) {
  let url = req.url

  // routing
  // -------
  if (url === '/__shutdown') {
    if (!isAllowed(req, res)) {
      return true
    }
    res.write('Bye')
    res.end()
    process.exit(0)
  }

  if (url === '/__flush') {
    if (!isAllowed(req, res)) {
      return true
    }
    res.write('Flushing cache')
    cache.flush()
    return true
  }

  if (url === '/__save') {
    if (!isAllowed(req, res)) {
      return true
    }
    res.write('Saving cache')
    cache.save()
    return true
  }

  if (url === '/__load') {
    if (!isAllowed(req, res)) {
      return true
    }
    res.write('Restoring cache...')
    cache.load()
    return true
  }

  if (url === '/__stat') {
    if (!isAllowed(req, res)) {
      return true
    }
    res.write('# cache stat\n\n' + cache.stat())
    return true
  }

  if (url === '/__help') {
    if (!isAllowed(req, res)) {
      return true
    }
    res.setHeader('content-type', 'text/html')
    res.write(`<html><head><title>help</title></title></head><body>
      <ul>
        <li><a href="/__shutdown">shutdown app</a></li>
        <li><a href="/__flush">flush mem cache</a></li>
        <li><a href="/__save">save cache to json</a></li>
        <li><a href="/__load">load cache from json</a></li>
        <li><a href="/__stat">stat mem cache</a></li>
        <li>
          <form action="/__set_target">
            <label>Target <input value="${config.target}" name="target"></label>
            <label>flush <input type="checkbox" name="flush" value="1"></label>
            <input type="submit">
          </form>
        </li>
      </ul>
    </body></html>`)
    return true
  }

  if (url.startsWith('/__set_target')) {
    if (!isAllowed(req, res)) {
      return true
    }
    const q = urlParser.parse(url, true).query
    const doFlush = q.flush === '1'
    if (q.target && q.target.startsWith('http')) {
      if (q.target === config.target) {
        res.write('Target not changed, nothing to do.')
      } else {
        config.target = q.target
        if (doFlush) {
          cache.flush()
        }
        res.write(`Target "${q.target}" saved. Cache ${doFlush ? '' : 'NOT '}flushed.`)
      }
    } else {
      res.write('Invalid target.')
    }
    return true
  }

  return false
}
