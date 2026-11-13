import {
  normalizeFootballData,
  normalizeOpenFootball,
  openFootballSeasonFolder,
} from './footballLive.js'
import type { LiveMatch } from './footballLive'

export type FootballApiPayload = {
  matches: LiveMatch[]
  warnings: string[]
  fetchedAt: string
}

type QueryMode = 'upcoming' | 'results'
type CacheEntry = {
  expiresAt: number
  payload: FootballApiPayload
}

const CACHE_TTL_MS = 5 * 60 * 1_000
const cache = new Map<string, CacheEntry>()

function safeParam(
  value: string | null,
  pattern: RegExp,
  fallback: string,
): string {
  return value !== null && pattern.test(value) ? value : fallback
}

function jsonResponse(payload: FootballApiPayload): Response {
  return new Response(JSON.stringify(payload), {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=300',
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

async function fetchJson(url: string, headers?: HeadersInit): Promise<unknown> {
  const response = await fetch(url, { headers })
  if (!response.ok) {
    throw new Error(`Upstream HTTP ${response.status}`)
  }
  return response.json() as Promise<unknown>
}

function selectMode(matches: readonly LiveMatch[], mode: QueryMode): LiveMatch[] {
  const wantedStatus = mode === 'results' ? 'FINISHED' : 'SCHEDULED'
  return matches
    .filter((match) => match.status === wantedStatus)
    .sort((left, right) => mode === 'results'
      ? Date.parse(right.kickoffUtc) - Date.parse(left.kickoffUtc)
      : Date.parse(left.kickoffUtc) - Date.parse(right.kickoffUtc),
    )
    .slice(0, 40)
}

export async function handleFootballFixtures(
  request: Request,
  footballDataToken: string | undefined,
): Promise<Response> {
  const url = new URL(request.url)
  const competition = safeParam(
    url.searchParams.get('competition')?.toUpperCase() ?? null,
    /^[A-Z0-9]{2,10}$/,
    'PL',
  )
  const season = safeParam(
    url.searchParams.get('season'),
    /^\d{4}(?:-\d{2})?$/,
    '2025',
  )
  const mode: QueryMode = url.searchParams.get('mode') === 'results'
    ? 'results'
    : 'upcoming'
  const cacheKey = `${competition}:${season}:${mode}`
  const cached = cache.get(cacheKey)

  if (cached && cached.expiresAt > Date.now()) {
    return jsonResponse(cached.payload)
  }

  const warnings: string[] = []
  const footballDataRequest = footballDataToken?.trim()
    ? fetchJson(
        `https://api.football-data.org/v4/competitions/${encodeURIComponent(competition)}/matches?season=${encodeURIComponent(season.slice(0, 4))}`,
        { 'X-Auth-Token': footballDataToken.trim() },
      )
    : null
  if (!footballDataRequest) {
    warnings.push('Jeton FOOTBALL_DATA_TOKEN absent : football-data.org est indisponible.')
  }

  const openFootballRequest = fetchJson(
    `https://raw.githubusercontent.com/openfootball/football.json/master/${encodeURIComponent(openFootballSeasonFolder(season))}/en.1.json`,
  )
  const [footballDataResult, openFootballResult] = await Promise.allSettled([
    footballDataRequest ?? Promise.resolve(null),
    openFootballRequest,
  ])

  const matches: LiveMatch[] = []
  if (footballDataResult.status === 'fulfilled' && footballDataResult.value !== null) {
    matches.push(...normalizeFootballData(footballDataResult.value))
  } else if (footballDataResult.status === 'rejected') {
    warnings.push('football-data.org est momentanément indisponible.')
  }

  if (openFootballResult.status === 'fulfilled') {
    matches.push(...normalizeOpenFootball(openFootballResult.value))
  } else {
    warnings.push('openfootball est momentanément indisponible.')
  }

  const payload: FootballApiPayload = {
    matches: selectMode(matches, mode),
    warnings,
    fetchedAt: new Date().toISOString(),
  }
  cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, payload })
  return jsonResponse(payload)
}
