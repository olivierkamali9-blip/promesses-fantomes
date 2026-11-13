import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

const limitBytes = 200 * 1024
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
  return { source, bytes: (await stat(file)).size }
}))
const total = sizes.reduce((sum, item) => sum + item.bytes, 0)

console.log(`Initial JavaScript: ${total} bytes (${scripts.join(', ')})`)
if (total > limitBytes) {
  throw new Error(`Initial JavaScript exceeds 200 KB: ${total} > ${limitBytes}`)
}
