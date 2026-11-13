import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const limitBytes = 100 * 1024
const html = await readFile(resolve('dist/index.html'), 'utf8')
const scriptSources = [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)]
  .map((match) => match[1])
const preloadSources = [...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+\.js)"/g)]
  .map((match) => match[1])
const scripts = [...new Set([...scriptSources, ...preloadSources])]

if (scripts.length === 0) {
  throw new Error('No initial JavaScript entry found in dist/index.html')
}

const sizes = await Promise.all(scripts.map(async (source) => {
  const file = resolve('dist', source.replace(/^\//, ''))
  const contents = await readFile(file)
  return {
    source,
    rawBytes: contents.length,
    gzipBytes: gzipSync(contents, { level: 9 }).length,
  }
}))
const rawTotal = sizes.reduce((sum, item) => sum + item.rawBytes, 0)
const gzipTotal = sizes.reduce((sum, item) => sum + item.gzipBytes, 0)

console.log(
  `Initial JavaScript: ${rawTotal} raw bytes, ${gzipTotal} gzipped bytes (${scripts.join(', ')})`,
)
if (gzipTotal > limitBytes) {
  throw new Error(
    `Initial JavaScript exceeds 100 KB gzipped: ${gzipTotal} > ${limitBytes}`,
  )
}
