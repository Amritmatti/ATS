// Zero-dependency static server for the built bundle.
// Exists so the runtime image does not have to carry the build toolchain.
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve, sep } from 'node:path'

const ROOT = resolve(process.env.STATIC_ROOT ?? 'dist')
const PORT = Number(process.env.PORT ?? 8080)
const HOST = process.env.HOST ?? '0.0.0.0'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
}

/** Resolve a URL path inside ROOT, or null if it tries to escape. */
function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0])
  const candidate = resolve(join(ROOT, normalize(decoded)))
  return candidate === ROOT || candidate.startsWith(ROOT + sep) ? candidate : null
}

async function fileOrNull(path) {
  try {
    const s = await stat(path)
    return s.isFile() ? s : null
  } catch {
    return null
  }
}

const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { allow: 'GET, HEAD' }).end('Method Not Allowed')
    return
  }

  const requested = safePath(req.url || '/')
  if (!requested) {
    res.writeHead(403).end('Forbidden')
    return
  }

  // Try the exact file, then index.html so client-side routes resolve. The fallback is
  // only for navigations — a missing .js must 404 rather than return HTML, which would
  // otherwise reach the browser as a module with the wrong content type.
  let target = await fileOrNull(requested)
  let path = requested
  let fallback = false
  if (!target) {
    const looksLikeNavigation =
      !extname(requested) || (req.headers.accept ?? '').includes('text/html')
    if (!looksLikeNavigation) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('Not Found')
      return
    }
    path = join(ROOT, 'index.html')
    target = await fileOrNull(path)
    fallback = true
  }
  if (!target) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not Found')
    return
  }

  const ext = extname(path).toLowerCase()
  // Hashed asset filenames change on every build, so they can cache forever.
  const immutable = !fallback && path.includes(`${sep}assets${sep}`)
  res.writeHead(200, {
    'content-type': MIME[ext] ?? 'application/octet-stream',
    'content-length': target.size,
    'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    'x-content-type-options': 'nosniff',
  })

  if (req.method === 'HEAD') {
    res.end()
    return
  }
  createReadStream(path).pipe(res)
})

server.listen(PORT, HOST, () => {
  console.log(`ATS Resume Pro serving ${ROOT} on http://${HOST}:${PORT}`)
})

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => server.close(() => process.exit(0)))
}
