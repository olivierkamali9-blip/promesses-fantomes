import type { Candidate } from '../ai/types'
import type { SourceAdapter } from './adapter'
import {
  isPoliticalCandidate,
  type PoliticalCandidate,
} from './politicalLive'

const CACHE_KEY = 'promesses-fantomes-political:v1'
const CACHE_TTL_MS = 10 * 60 * 1_000

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>
type UnknownRecord = Record<string, unknown>

type CachePayload = {
  expiresAt: number
  refreshedAt: number
  candidates: PoliticalCandidate[]
}

export type PoliticalHttpAdapterOptions = {
  endpoint?: string
  fetcher?: typeof fetch
  storage?: StorageLike | null
  now?: () => number
}

function browserStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export class PoliticalHttpAdapter implements SourceAdapter {
  readonly mode = 'live' as const
  private readonly endpoint: string
  private readonly fetcher: typeof fetch
  private readonly storage: StorageLike | null
  private readonly now: () => number
  private sessionLoad: Promise<PoliticalCandidate[]> | null = null
  private refreshedAt: number | null = null

  constructor(options: PoliticalHttpAdapterOptions = {}) {
    this.endpoint = options.endpoint ?? '/api/political'
    this.fetcher = options.fetcher ?? globalThis.fetch
    this.storage = options.storage === undefined ? browserStorage() : options.storage
    this.now = options.now ?? Date.now
  }

  get lastRefreshAt(): number | null {
    return this.refreshedAt
  }

  private readCache(): PoliticalCandidate[] | null {
    if (!this.storage) return null
    try {
      const raw = this.storage.getItem(CACHE_KEY)
      if (!raw) return null
      const value: unknown = JSON.parse(raw)
      if (!isRecord(value) ||
          typeof value.expiresAt !== 'number' ||
          value.expiresAt <= this.now() ||
          typeof value.refreshedAt !== 'number' ||
          !Array.isArray(value.candidates) ||
          !value.candidates.every(isPoliticalCandidate)) {
        return null
      }
      this.refreshedAt = value.refreshedAt
      return value.candidates
    } catch {
      return null
    }
  }

  private writeCache(candidates: PoliticalCandidate[], refreshedAt: number) {
    if (!this.storage) return
    try {
      const payload: CachePayload = {
        expiresAt: this.now() + CACHE_TTL_MS,
        refreshedAt,
        candidates,
      }
      this.storage.setItem(CACHE_KEY, JSON.stringify(payload))
    } catch {
      // Monitoring still works when browser storage is unavailable.
    }
  }

  private async loadRemote(): Promise<PoliticalCandidate[]> {
    const controller = new AbortController()
    const timeout = globalThis.setTimeout(() => controller.abort(), 8_000)
    try {
      const response = await this.fetcher(this.endpoint, { signal: controller.signal })
      if (!response.ok) throw new Error(`Veille politique indisponible (${response.status}).`)
      const value: unknown = await response.json()
      if (!isRecord(value) || !Array.isArray(value.candidates)) {
        throw new Error('Réponse invalide de la veille politique.')
      }
      const candidates = value.candidates.filter(isPoliticalCandidate)
      const refreshedAt = typeof value.fetchedAt === 'string' && Number.isFinite(Date.parse(value.fetchedAt))
        ? Date.parse(value.fetchedAt)
        : this.now()
      this.refreshedAt = refreshedAt
      this.writeCache(candidates, refreshedAt)
      return candidates
    } catch (error) {
      if (controller.signal.aborted) throw new Error('La veille politique a dépassé 8 secondes.')
      throw error
    } finally {
      globalThis.clearTimeout(timeout)
    }
  }

  private load(): Promise<PoliticalCandidate[]> {
    return Promise.resolve(this.readCache()).then((cached) => cached ?? this.loadRemote())
  }

  searchNews(query: string): Promise<Candidate[]> {
    const load = this.sessionLoad ?? this.load()
    this.sessionLoad = load
    const normalized = query.trim().toLocaleLowerCase('fr')
    return load.then((candidates) => normalized.length === 0
      ? candidates.map((candidate) => ({ ...candidate }))
      : candidates
          .filter((candidate) =>
            `${candidate.title} ${candidate.exactStatement}`
              .toLocaleLowerCase('fr')
              .includes(normalized),
          )
          .map((candidate) => ({ ...candidate })),
    ).finally(() => {
      if (this.sessionLoad === load) this.sessionLoad = null
    })
  }
}
