import type { Candidate } from '../ai/types'
import type { SourceAdapter } from './adapter'
import { FixtureAdapter } from './adapter'
import { HttpAdapter } from './httpAdapter'
import { PoliticalHttpAdapter } from './politicalHttp'

export type AdapterMode = 'live' | 'demo'
export type RefreshAwareSourceAdapter = SourceAdapter & {
  readonly lastRefreshAt?: number | null
  readonly lastWarning?: string | null
}
export type ModeAwareSourceAdapter = SourceAdapter & {
  readonly mode: AdapterMode
  readonly lastRefreshAt?: number | null
  readonly lastWarning?: string | null
  readonly supportsLiveRefresh?: boolean
}

export class CombinedLiveAdapter implements SourceAdapter {
  readonly mode = 'live' as const
  private warning: string | null = null

  constructor(private readonly adapters: readonly RefreshAwareSourceAdapter[]) {}

  get lastRefreshAt(): number | null {
    const refreshes = this.adapters
      .map((adapter) => adapter.lastRefreshAt)
      .filter((value): value is number => typeof value === 'number')
    return refreshes.length > 0 ? Math.max(...refreshes) : null
  }

  get lastWarning(): string | null {
    return this.warning
  }

  async searchNews(query: string): Promise<Candidate[]> {
    const results = await Promise.allSettled(
      this.adapters.map((adapter) => adapter.searchNews(query)),
    )
    const candidates = results.flatMap((result) =>
      result.status === 'fulfilled' ? result.value : [],
    )
    const failures = results.flatMap((result) =>
      result.status === 'rejected'
        ? [result.reason instanceof Error ? result.reason.message : 'Source réelle indisponible']
        : [],
    )
    this.warning = failures.length > 0
      ? `Veille partielle : ${failures.join(' ')}`
      : null

    if (candidates.length === 0) {
      throw new Error(this.warning ?? 'Aucune source réelle n’est disponible.')
    }

    return candidates.filter(
      (candidate, index, all) =>
        all.findIndex((item) =>
          item.sourceUrl === candidate.sourceUrl && item.title === candidate.title,
        ) === index,
    )
  }
}

class FallbackSourceAdapter implements ModeAwareSourceAdapter {
  private activeMode: AdapterMode = 'live'
  private fallbackWarning: string | null = null
  readonly supportsLiveRefresh = true

  constructor(
    private readonly live: RefreshAwareSourceAdapter,
    private readonly fallback: FixtureAdapter,
  ) {}

  get mode(): AdapterMode {
    return this.activeMode
  }

  get lastRefreshAt(): number | null {
    if (this.activeMode !== 'live') return null
    return this.live.lastRefreshAt ?? null
  }

  get lastWarning(): string | null {
    return this.activeMode === 'live'
      ? this.live.lastWarning ?? null
      : this.fallbackWarning
  }

  async searchNews(query: string) {
    try {
      const candidates = await this.live.searchNews(query)
      this.activeMode = 'live'
      this.fallbackWarning = null
      return candidates
    } catch (error) {
      this.activeMode = 'demo'
      this.fallbackWarning = error instanceof Error
        ? error.message
        : 'Sources en direct indisponibles.'
      return this.fallback.searchNews(query)
    }
  }
}

function environmentDemoMode(): boolean {
  const environment = (
    import.meta as ImportMeta & {
      readonly env?: Readonly<Record<string, string | undefined>>
    }
  ).env
  return environment?.VITE_DEMO === '1'
}

export function createAdapter(
  demoMode = environmentDemoMode(),
  liveAdapter: RefreshAwareSourceAdapter = new CombinedLiveAdapter([
    new HttpAdapter(),
    new PoliticalHttpAdapter(),
  ]),
  fixtureAdapter = new FixtureAdapter(),
): ModeAwareSourceAdapter {
  if (demoMode) {
    return fixtureAdapter
  }

  return new FallbackSourceAdapter(liveAdapter, fixtureAdapter)
}

export { FixtureAdapter, HttpAdapter, PoliticalHttpAdapter }
export type { SourceAdapter }
