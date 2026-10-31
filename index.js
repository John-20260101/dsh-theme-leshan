/**
 * Host half of dsh-theme-leshan.
 *
 * The theme itself is browser-side (tokens + rail, shipped through
 * `exports["./client"]`). What the host adds is the photographs: the three
 * Leshan wallpapers are served over a plugin-owned route so `client.js` can
 * reference real files instead of carrying ~1.8 MB of base64.
 *
 * Route: GET/HEAD /dsh-theme-leshan/wallpapers/<file>
 *   - exact-file whitelist, never a directory listing
 *   - strong ETag + immutable caching, 304 on revalidation
 *   - traversal is impossible by construction: only whitelisted names resolve
 *
 * Without the `webServer` service the route is simply absent; the browser half
 * then falls back to a wash instead of a photograph and stays fully usable.
 */

import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Stable cordis plugin name. */
export const name = 'themeLeshan'

/** Hard dependency on the HTTP carrier, so the route cannot lose to the SPA fallback. */
export const inject = ['webServer']

/** Public prefix hard-coded by the browser half (`client.js`). */
const BASE = '/dsh-theme-leshan/wallpapers'

/** Directory the photographs live in, next to this file. */
const DIR = join(dirname(fileURLToPath(import.meta.url)), 'assets', 'wallpapers')

/** Exact names this route may serve. */
const ALLOW = new Set([
  'leshan-sanjiang-1448x1086.jpg',
  'leshan-lingyun-1536x1024.jpg',
  'leshan-emei-1536x1024.jpg',
])

/**
 * Stream one whitelisted wallpaper.
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} file absolute path inside {@link DIR}
 */
function serve(req, res, file) {
  stat(file).then((info) => {
    const etag = `"leshan-${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"`
    const headers = {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      ETag: etag,
      'Last-Modified': info.mtime.toUTCString(),
    }
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, { ETag: etag, 'Cache-Control': headers['Cache-Control'] })
      res.end()
      return
    }
    res.writeHead(200, { ...headers, 'Content-Length': String(info.size) })
    if (req.method === 'HEAD') {
      res.end()
      return
    }
    createReadStream(file).on('error', () => res.destroy()).pipe(res)
  }).catch(() => {
    res.statusCode = 404
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('not found')
  })
}

/**
 * Register the wallpaper route for as long as this row lives.
 * @param {import('@deepseek-ai/cordis').Context} ctx host context
 */
export function apply(ctx) {
  const webServer = ctx && ctx.webServer
  if (!webServer || typeof webServer.register !== 'function') return () => {}

  ctx.effect(() => webServer.register({
    kind: 'prefix',
    path: BASE,
    handler: (req, res) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.statusCode = 405
        res.setHeader('Allow', 'GET, HEAD')
        res.end()
        return
      }
      const urlPath = (req.url ?? '').split('?')[0]
      if (!urlPath.startsWith(`${BASE}/`)) {
        res.statusCode = 404
        res.end('not found')
        return
      }
      let name
      try {
        name = decodeURIComponent(urlPath.slice(BASE.length + 1))
      } catch (error) {
        res.statusCode = 400
        res.end('bad request')
        return
      }
      // Whitelist first: a name with a slash, `..`, or an unlisted file is 404
      // before any filesystem call happens.
      if (!ALLOW.has(name)) {
        res.statusCode = 404
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end('not found')
        return
      }
      serve(req, res, join(DIR, name))
    },
  }), 'leshan: wallpaper route')
}
