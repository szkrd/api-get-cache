API GET cache
=============

Node http transparent proxy with in memory caching for GET calls.

This is mostly for debugging: I use it to cache an unstable system's script responses,
so I can keep on working even if the remote server is being restarted (which may last
for minutes).

Sometimes I need to work with http only api endpoints, but my local server
needs to be https, so to avoid downgrading I can add my own cert. In an _ideal world_
the backend api would return https with the same dev cert the frontend team uses.

Anything production related you are probably looking for something
like [Varnish](http://varnish-cache.org/).

## env vars (nodemon.json)

```json
{
  "env": {
    "TARGET": "https://api.github.com/",
    "MAX_WAIT_TIME": 1000,
    "TTL": 5000,
    "PORT": 4000,
    "MODIFY_HOST_HEADER": false,
    "HTTPS_PORT": 4002,
    "HTTPS_KEY": "/foo/bar/ca.key",
    "HTTPS_CERT": "/foo/bar/ca.crt",
    "CONTENT_BLACKLIST": "<h1>We'll be back shortly</h1>|<p>Temporarily unavailable due to maintenance</p>|>Initialization failed</h1>"
  }
}
```

* `SSL` section (cert, key, https_port) is optional.
* `TTL` is the cache item ttl in msec, use -1 for infinity
* `MODIFY_HOST_HEADER` true replaces current host with target host in the request
* `CONTENT_BLACKLIST` is a pipe separated list of strings, blacklisted resources will not be saved

## usage

1. `npm i`
2. create `nodemon.json`
3. `npm run dev`
4. add `yourhost.dev` as 127.0.0.1 to your hosts file (if you want it to match with your cert)
5. example call url: _https://yourhost.dev:4000/users/octocat_

## internal api

All endpoints are GET, now we have a help page at `/__help`
[example](http://localhost:4000/__help)
