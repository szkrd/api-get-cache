const urlParser = require('url')
const cache = require('./cache')
const config = require('./config')

module.exports = function handleControlApi (url, res) {
  let handled
  if (url === '/__shutdown') {
    res.write('Bye')
    res.end()
    handled = true
    process.exit(0)
  } else if (url === '/__flush') {
    res.write('Flushing cache')
    cache.flush()
    handled = true
  } else if (url === '/__save') {
    res.write('Saving cache')
    cache.save()
    handled = true
  } else if (url === '/__load') {
    res.write('Restoring cache...')
    cache.load()
    handled = true
  } else if (url === '/__stat') {
    res.write('# cache stat\n\n' + cache.stat())
    handled = true
  } else if (url === '/__help') {
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
    handled = true
  } else if (url.startsWith('/__set_target')) {
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
    handled = true
  }
  return handled
}
