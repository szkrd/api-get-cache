const config = require('./config');

let cache = {};

// store in mem cache
function store (url, method, result) {
  cache[`${url}_${method}`] = {
    timestamp: Date.now(),
    expired: false,
    result
  };
}

// retrieve from mem cache
function retrieve (url, method, desperate) {
  let item = cache[`${url}_${method}`];
  if (!item) {
    return;
  }
  if (Date.now() - item.timestamp > config.ttl) {
    item.expired = true;
  }
  if (!desperate && item.expired) {
    return;
  }
  return item.result;
}

function flush () {
  Object.keys(cache).forEach(key => delete cache[key]);
}

module.exports = {
  store,
  retrieve,
  flush
};
