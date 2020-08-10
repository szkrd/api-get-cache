let config = {
  username: process.env.USERNAME || '',
  password: process.env.PASSWORD || '',
  authBearer: process.env.AUTH_BEARER || '',
  port: parseInt(process.env.PORT, 10) || 80,
  httpsPort: parseInt(process.env.HTTPS_PORT, 10) || 443,
  target: process.env.TARGET.replace(/\/+$/, ''),
  httpsKey: process.env.HTTPS_KEY,
  httpsCert: process.env.HTTPS_CERT,
  maxWaitTime: parseInt(process.env.MAX_WAIT_TIME, 10) || 1000, // 1sec default
  ttl: parseInt(process.env.TTL, 10) || 5000, // 5sec cache ttl
  contentBlacklist: (process.env.CONTENT_BLACKLIST || '').split('|'),
  modifyHostHeader: Boolean(process.env.MODIFY_HOST_HEADER),
  noFavIcon: true,
  allowControlUrls: true
}

module.exports = config
