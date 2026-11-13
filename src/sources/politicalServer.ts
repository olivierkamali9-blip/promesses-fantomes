import {
  politicalCandidateFromStatement,
  type PoliticalCandidate,
} from './politicalLive.js'

export type PoliticalPayload = {
  candidates: PoliticalCandidate[]
  warnings: string[]
  fetchedAt: string
}

type PoliticalSource = {
  name: string
  listUrl: string
  independentGroup: string
  allowedHost: string
  articlePath: RegExp
}

const SOURCES: readonly PoliticalSource[] = [
  {
    name: 'Présidence RDC',
    listUrl: 'https://presidence.cd/actualites',
    independentGroup: 'presidence-rdc',
    allowedHost: 'presidence.cd',
    articlePath: /^\/actualite-detail\/actualite\//,
  },
  {
    name: 'Communication du Gouvernement RDC',
    listUrl: 'https://communication.gouv.cd/actualites',
    independentGroup: 'gouvernement-rdc',
    allowedHost: 'communication.gouv.cd',
    articlePath: /^\/actualites\//,
  },
  {
    name: 'Radio Okapi',
    listUrl: 'https://www.radiookapi.net/mot-cle/politique',
    independentGroup: 'radio-okapi',
    allowedHost: 'www.radiookapi.net',
    articlePath: /^\/20\d{2}\/\d{2}\/\d{2}\/actualite\//,
  },
]

const CACHE_TTL_MS = 10 * 60 * 1_000
let cached: { expiresAt: number; payload: PoliticalPayload } | null = null

function decodeEntities(value: string): string {
  const named: Readonly<Record<string, string>> = {
    amp: '&', quot: '"', apos: "'", nbsp: ' ', lt: '<', gt: '>',
  }
  return value.replace(/&(#\d+|#x[\da-f]+|\w+);/giu, (_match, entity: string) => {
    if (entity.startsWith('#')) {
      const radix = entity.startsWith('#x') ? 16 : 10
      const digits = entity.slice(radix === 16 ? 2 : 1)
      const codePoint = Number.parseInt(digits, radix)
      return codePoint >= 0 && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : ' '
    }
    return named[entity.toLocaleLowerCase('en')] ?? ' '
  })
}

function plainText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script\b[\s\S]*?<\/script>/giu, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/giu, ' ')
      .replace(/<[^>]+>/gu, ' '),
  ).replace(/\s+/g, ' ').trim()
}

function articleLinks(html: string, source: PoliticalSource): string[] {
  const links: string[] = []
  const pattern = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/giu
  for (const match of html.matchAll(pattern)) {
    try {
      const url = new URL(match[1], source.listUrl)
      if (
        url.protocol === 'https:' &&
        url.hostname === source.allowedHost &&
        source.articlePath.test(url.pathname) &&
        !links.includes(url.href)
      ) {
        links.push(url.href)
      }
    } catch {
      // Ignore malformed links from source pages.
    }
  }
  return links.slice(0, 8)
}

function statementSentences(html: string): string[] {
  const blocks: string[] = []
  const pattern = /<(p|blockquote|h[1-3])\b[^>]*>([\s\S]*?)<\/\1>/giu
  for (const match of html.matchAll(pattern)) {
    const text = plainText(match[2])
    if (text.length > 0) blocks.push(text)
  }

  return blocks.flatMap((block) =>
    block
      .split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ«])/u)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length >= 24 && sentence.length <= 500),
  )
}

function publishedAtFromHtml(html: string): string | null {
  const patterns = [
    /["']datePublished["']\s*:\s*["']([^"']+)["']/iu,
    /<meta\b[^>]*(?:property|name)=["'](?:article:published_time|datePublished)["'][^>]*content=["']([^"']+)["']/iu,
    /<time\b[^>]*datetime=["']([^"']+)["']/iu,
  ]
  for (const pattern of patterns) {
    const value = pattern.exec(html)?.[1]
    const timestamp = value ? Date.parse(value) : Number.NaN
    if (Number.isFinite(timestamp)) return new Date(timestamp).toISOString()
  }
  return null
}

async function fetchText(url: string, allowedHost: string): Promise<string> {
  const target = new URL(url)
  if (target.protocol !== 'https:' || target.hostname !== allowedHost) {
    throw new Error('Source URL refusée.')
  }

  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), 6_000)
  try {
    const response = await fetch(target, {
      redirect: 'error',
      signal: controller.signal,
      headers: { 'User-Agent': 'PromessesFantomes/1.0' },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return (await response.text()).slice(0, 1_000_000)
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

async function candidatesFromSource(
  source: PoliticalSource,
  now: number,
): Promise<PoliticalCandidate[]> {
  const listHtml = await fetchText(source.listUrl, source.allowedHost)
  const links = articleLinks(listHtml, source)
  const articleResults = await Promise.allSettled(links.map(async (url) => ({
    url,
    html: await fetchText(url, source.allowedHost),
  })))
  const candidates: PoliticalCandidate[] = []

  for (const result of articleResults) {
    if (result.status !== 'fulfilled') continue
    const publishedAt = publishedAtFromHtml(result.value.html)
    if (!publishedAt) continue
    for (const sentence of statementSentences(result.value.html)) {
      const candidate = politicalCandidateFromStatement(
        sentence,
        {
          url: result.value.url,
          name: source.name,
          independentGroup: source.independentGroup,
          publishedAt,
        },
        now,
      )
      if (candidate && !candidates.some((item) => item.sourceUrl === candidate.sourceUrl)) {
        candidates.push(candidate)
        break
      }
    }
  }

  return candidates
}

function response(payload: PoliticalPayload): Response {
  return new Response(JSON.stringify(payload), {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=600',
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

export async function handlePoliticalStatements(): Promise<Response> {
  const now = Date.now()
  if (cached && cached.expiresAt > now) return response(cached.payload)

  const results = await Promise.allSettled(
    SOURCES.map((source) => candidatesFromSource(source, now)),
  )
  const warnings: string[] = []
  const candidates = results.flatMap((result, index) => {
    if (result.status === 'fulfilled') return result.value
    warnings.push(`${SOURCES[index].name} est momentanément indisponible.`)
    return []
  })
  const payload: PoliticalPayload = {
    candidates: candidates
      .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt))
      .slice(0, 8),
    warnings,
    fetchedAt: new Date(now).toISOString(),
  }
  cached = { expiresAt: now + CACHE_TTL_MS, payload }
  return response(payload)
}
