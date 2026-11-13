import type { Candidate } from '../ai/types'
import type { SourceAdapter } from './adapter'
import {
  footballMatchesToCandidates,
  isLiveMatch,
  type LiveMatch,
} from './footballLive'

export type HttpAdapterOptions = {
  endpoint?: string
  competition?: string
  season?: string
  mode?: 'upcoming' | 'results'
  fetcher?: typeof fetch
}

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function responseMatches(value: unknown): LiveMatch[] {
  if (!isRecord(value) || !Array.isArray(value.matches)) {
    throw new Error('Réponse invalide du service de football.')
  }

  return value.matches.filter(isLiveMatch)
}

function responseWarnings(value: unknown): string[] {
  if (!isRecord(value) || !Array.isArray(value.warnings)) {
    return []
  }

  return value.warnings.filter(
    (warning): warning is string => typeof warning === 'string' && warning.trim().length > 0,
  )
}

export class HttpAdapter implements SourceAdapter {
  readonly mode = 'live' as const
  private readonly endpoint: string
  private readonly competition: string
  private readonly season: string
  private readonly requestMode: 'upcoming' | 'results'
  private readonly fetcher: typeof fetch

  constructor(options: HttpAdapterOptions = {}) {
    this.endpoint = options.endpoint ?? '/api/fixtures'
    this.competition = options.competition ?? 'PL'
    this.season = options.season ?? '2025'
    this.requestMode = options.mode ?? 'upcoming'
    this.fetcher = options.fetcher ?? fetch
  }

  async searchNews(query: string): Promise<Candidate[]> {
    const controller = new AbortController()
    const timeout = globalThis.setTimeout(() => controller.abort(), 6_000)

    try {
      const params = new URLSearchParams({
        competition: this.competition,
        season: this.season,
        mode: this.requestMode,
      })
      const response = await this.fetcher(`${this.endpoint}?${params.toString()}`, {
        signal: controller.signal,
      })
      if (!response.ok) {
        throw new Error(`Service de football indisponible (${response.status}).`)
      }

      const json: unknown = await response.json()
      const matches = responseMatches(json)
      const warnings = responseWarnings(json)
      const candidates = footballMatchesToCandidates(matches)
      if (candidates.length === 0 && warnings.length > 0) {
        throw new Error(warnings.join(' '))
      }

      const normalizedQuery = query.trim().toLocaleLowerCase('fr')
      return normalizedQuery.length === 0
        ? candidates
        : candidates.filter((candidate) =>
            `${candidate.title} ${candidate.excerpt}`
              .toLocaleLowerCase('fr')
              .includes(normalizedQuery),
          )
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error('La source de football a dépassé le délai de 6 secondes.')
      }
      throw error
    } finally {
      globalThis.clearTimeout(timeout)
    }
  }
}
