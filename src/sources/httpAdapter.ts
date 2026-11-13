import type { Candidate } from '../ai/types'
import type { SourceAdapter } from './adapter'
import {
  footballMatchesToCandidates,
  isLiveFootballCandidate,
  isLiveMatch,
  selectLiveFootballCandidates,
  type LiveFootballCandidate,
  type LiveMatch,
} from './footballLive'

const LIVE_CACHE_TTL_MS = 10 * 60 * 1_000
const LIVE_CACHE_VERSION = 2
const LIVE_CACHE_PREFIX = 'promesses-fantomes-live-football'

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

export type HttpAdapterOptions = {
  endpoint?: string
  competition?: string
  season?: string
  replaySeason?: string
  mode?: 'upcoming' | 'results'
  fetcher?: typeof fetch
  storage?: StorageLike | null
  now?: () => number
}

type UnknownRecord = Record<string, unknown>

type FootballResponse = {
  matches: LiveMatch[]
  warnings: string[]
  fetchedAt: number
}

type CachedLiveImport = {
  version: typeof LIVE_CACHE_VERSION
  expiresAt: number
  refreshedAt: number
  candidates: LiveFootballCandidate[]
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function browserStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function currentFootballSeason(at: number): string {
  const date = new Date(at)
  const year = date.getUTCFullYear()
  return String(date.getUTCMonth() >= 6 ? year : year - 1)
}

function responsePayload(value: unknown): FootballResponse {
  if (!isRecord(value) || !Array.isArray(value.matches)) {
    throw new Error('Réponse invalide du service de football.')
  }

  const matches = value.matches.filter(isLiveMatch)
  const warnings = Array.isArray(value.warnings)
    ? value.warnings.filter(
        (warning): warning is string =>
          typeof warning === 'string' && warning.trim().length > 0,
      )
    : []
  const fetchedAt = typeof value.fetchedAt === 'string'
    ? Date.parse(value.fetchedAt)
    : Number.NaN

  return {
    matches,
    warnings,
    fetchedAt: Number.isFinite(fetchedAt) ? fetchedAt : Date.now(),
  }
}

function cachedImport(value: unknown, now: number): CachedLiveImport | null {
  if (!isRecord(value) ||
      value.version !== LIVE_CACHE_VERSION ||
      typeof value.expiresAt !== 'number' ||
      value.expiresAt <= now ||
      typeof value.refreshedAt !== 'number' ||
      !Array.isArray(value.candidates) ||
      !value.candidates.every(isLiveFootballCandidate)) {
    return null
  }

  return {
    version: LIVE_CACHE_VERSION,
    expiresAt: value.expiresAt,
    refreshedAt: value.refreshedAt,
    candidates: value.candidates,
  }
}

export class HttpAdapter implements SourceAdapter {
  readonly mode = 'live' as const
  private readonly endpoint: string
  private readonly competition: string
  private readonly season?: string
  private readonly replaySeason: string
  private readonly requestMode?: 'upcoming' | 'results'
  private readonly fetcher: typeof fetch
  private readonly storage: StorageLike | null
  private readonly now: () => number
  private sessionLoad: Promise<LiveFootballCandidate[]> | null = null
  private refreshedAt: number | null = null

  constructor(options: HttpAdapterOptions = {}) {
    this.endpoint = options.endpoint ?? '/api/fixtures'
    this.competition = options.competition ?? 'PL'
    this.season = options.season
    this.replaySeason = options.replaySeason ?? '2025-26'
    this.requestMode = options.mode
    this.fetcher = options.fetcher ?? globalThis.fetch
    this.storage = options.storage === undefined ? browserStorage() : options.storage
    this.now = options.now ?? Date.now
  }

  get lastRefreshAt(): number | null {
    return this.refreshedAt
  }

  private cacheKey(upcomingSeason: string): string {
    const mode = this.requestMode ?? 'combined'
    return `${LIVE_CACHE_PREFIX}:v${LIVE_CACHE_VERSION}:${this.competition}:${upcomingSeason}:${this.replaySeason}:${mode}`
  }

  private readCache(key: string, now: number): LiveFootballCandidate[] | null {
    if (!this.storage) return null
    try {
      const raw = this.storage.getItem(key)
      if (!raw) return null
      const cached = cachedImport(JSON.parse(raw) as unknown, now)
      if (!cached) return null
      this.refreshedAt = cached.refreshedAt
      return cached.candidates
    } catch {
      return null
    }
  }

  private writeCache(
    key: string,
    candidates: LiveFootballCandidate[],
    refreshedAt: number,
  ): void {
    if (!this.storage) return
    try {
      const payload: CachedLiveImport = {
        version: LIVE_CACHE_VERSION,
        expiresAt: this.now() + LIVE_CACHE_TTL_MS,
        refreshedAt,
        candidates,
      }
      this.storage.setItem(key, JSON.stringify(payload))
    } catch {
      // Live data remains available when storage is unavailable or full.
    }
  }

  private async fetchMode(
    season: string,
    mode: 'upcoming' | 'results',
    signal: AbortSignal,
  ): Promise<FootballResponse> {
    const params = new URLSearchParams({
      competition: this.competition,
      season,
      mode,
    })
    const response = await this.fetcher(`${this.endpoint}?${params.toString()}`, {
      signal,
    })
    if (!response.ok) {
      throw new Error(`Service de football indisponible (${response.status}).`)
    }

    const payload = responsePayload(await response.json())
    if (payload.matches.length === 0 && payload.warnings.length > 0) {
      throw new Error(payload.warnings.join(' '))
    }
    return payload
  }

  private async loadRemote(
    upcomingSeason: string,
    key: string,
  ): Promise<LiveFootballCandidate[]> {
    const controller = new AbortController()
    const timeout = globalThis.setTimeout(() => controller.abort(), 6_000)

    try {
      const requests = this.requestMode === 'upcoming'
        ? [this.fetchMode(upcomingSeason, 'upcoming', controller.signal)]
        : this.requestMode === 'results'
          ? [this.fetchMode(this.replaySeason, 'results', controller.signal)]
          : [
              this.fetchMode(upcomingSeason, 'upcoming', controller.signal),
              this.fetchMode(this.replaySeason, 'results', controller.signal),
            ]
      const results = await Promise.allSettled(requests)
      const payloads = results.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : [],
      )
      if (payloads.length === 0) {
        const failure = results.find((result) => result.status === 'rejected')
        throw failure && failure.status === 'rejected'
          ? failure.reason
          : new Error('Les modes football sont indisponibles.')
      }
      const candidates = selectLiveFootballCandidates(
        payloads.flatMap((payload) =>
          footballMatchesToCandidates(payload.matches),
        ),
        this.now(),
      )

      if (candidates.length === 0) {
        throw new Error('Aucun match football vérifiable n’est disponible.')
      }

      const refreshedAt = Math.max(...payloads.map((payload) => payload.fetchedAt))
      this.refreshedAt = refreshedAt
      this.writeCache(key, candidates, refreshedAt)
      return candidates
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error('La source de football a dépassé le délai de 6 secondes.')
      }
      throw error
    } finally {
      globalThis.clearTimeout(timeout)
    }
  }

  private loadCandidates(): Promise<LiveFootballCandidate[]> {
    const now = this.now()
    const upcomingSeason = this.season ?? currentFootballSeason(now)
    const key = this.cacheKey(upcomingSeason)
    const cached = this.readCache(key, now)
    return cached
      ? Promise.resolve(cached)
      : this.loadRemote(upcomingSeason, key)
  }

  searchNews(query: string): Promise<Candidate[]> {
    const load = this.sessionLoad ?? this.loadCandidates()
    this.sessionLoad = load
    const normalizedQuery = query.trim().toLocaleLowerCase('fr')

    return load.then((candidates) =>
      normalizedQuery.length === 0
        ? candidates.map((candidate) => ({ ...candidate }))
        : candidates
            .filter((candidate) =>
              `${candidate.title} ${candidate.excerpt}`
                .toLocaleLowerCase('fr')
                .includes(normalizedQuery),
            )
            .map((candidate) => ({ ...candidate })),
    ).finally(() => {
      if (this.sessionLoad === load) this.sessionLoad = null
    })
  }
}
