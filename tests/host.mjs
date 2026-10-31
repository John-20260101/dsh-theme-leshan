#!/usr/bin/env node
/**
 * Host route test: the wallpaper endpoint is whitelisted, cached and
 * HEAD-correct. Uses the real handler with a synthetic request/response pair.
 */
import { Writable } from 'node:stream'
import { stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { apply } from '../index.js'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const FILE = 'leshan-lingyun-1536x1024.jpg'

const problems = []
const check = (ok, message) => { if (!ok) problems.push(message) }

let route = null
apply({
  effect: (fn) => { fn(); return () => {} },
  webServer: { register: (config) => { route = config; return () => {} } },
})
check(route !== null, 'route was not registered')
check(route?.kind === 'prefix', 'route must be a prefix route')
check(route?.path === '/dsh-theme-leshan/wallpapers', `unexpected path ${route?.path}`)

const makeRes = () => {
  const chunks = []
  const res = new Writable({ write(chunk, encoding, callback) { chunks.push(chunk); callback() } })
  res.headers = {}
  res.statusCode = 200
  res.writeHead = (code, headers) => {
    res.statusCode = code
    for (const [key, value] of Object.entries(headers ?? {})) res.headers[key.toLowerCase()] = value
  }
  res.setHeader = (key, value) => { res.headers[key.toLowerCase()] = value }
  res.body = () => Buffer.concat(chunks)
  return res
}

const call = (method, url, headers = {}) => new Promise((resolve) => {
  const req = { method, url, headers }
  const res = makeRes()
  res.on('finish', () => resolve(res))
  route.handler(req, res)
})

const info = await stat(join(ROOT, 'assets/wallpapers', FILE))

const get = await call('GET', `/dsh-theme-leshan/wallpapers/${FILE}`)
check(get.statusCode === 200, `GET status ${get.statusCode}`)
check(get.headers['content-type'] === 'image/jpeg', 'GET content-type')
check(Number(get.headers['content-length']) === info.size, 'GET content-length')
check(get.body().length === info.size, 'GET body size')

const head = await call('HEAD', `/dsh-theme-leshan/wallpapers/${FILE}`)
check(head.statusCode === 200, `HEAD status ${head.statusCode}`)
check(head.body().length === 0, 'HEAD must not send a body')

const revalidated = await call('GET', `/dsh-theme-leshan/wallpapers/${FILE}`, { 'if-none-match': get.headers.etag })
check(revalidated.statusCode === 304, `304 expected, got ${revalidated.statusCode}`)

for (const attempt of [
  ['GET', '/dsh-theme-leshan/wallpapers/../../package.json'],
  ['GET', '/dsh-theme-leshan/wallpapers/%2e%2e%2fpackage.json'],
  ['GET', '/dsh-theme-leshan/wallpapers/index.js'],
  ['GET', '/dsh-theme-leshan/wallpapers/'],
]) {
  const res = await call(attempt[0], attempt[1])
  check(res.statusCode === 404, `${attempt[1]} should 404, got ${res.statusCode}`)
}

const post = await call('POST', `/dsh-theme-leshan/wallpapers/${FILE}`)
check(post.statusCode === 405, `POST should 405, got ${post.statusCode}`)

if (problems.length > 0) {
  console.error(problems.map((line) => `FAIL ${line}`).join('\n'))
  process.exit(1)
}
console.log('host OK — 200/304/HEAD/404 traversal/405 method, size matches file')
