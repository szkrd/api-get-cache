API GET cache
=============

Node http transparent proxy with in memory caching for GET calls.

## env vars (nodemon.json)

```json
{
  "env": {
    "TARGET": "https://cms.dev.webdev.local",
    "MAX_WAIT_TIME": 1000,
    "TTL": 5000,

    "PORT": 80,
    "HTTPS_PORT": 4002,
    "HTTPS_KEY": "/foo/bar/ca.key",
    "HTTPS_CERT": "/foo/bar/ca.crt",
    "CONTENT_BLACKLIST": "<h1>We'll be back shortly</h1>|<p>Temporarily unavailable due to maintenance</p>"
  }
}
```

* SSL section (cert, key, https_port) is optional.
* TTL is the cache item ttl in msec
* CONTENT_BLACKLIST is a pipe separated list of strings

## usage

1. `npm i`
2. create `nodemon.json`
3. `npm run dev`
4. add `prepair.dev` as 127.0.0.1 to your hosts file
5. example url: _https://prepair.dev:4002/api/resources/en-gb/commonresources?package=prepair_

## internal api

* `/__shutdown` GET - clean process exit
* `/__flush` GET - empty mem cache

## TODO

- [ ] fix unzip/rezip
- [ ] store good, but slow responses in cache even if we returned smg else already 
- [ ] option to cache non-GET responses?
- [ ] __stat endpoint
