import type { Candidate } from '../ai/types'
import type { SourceAdapter } from './adapter'
import { FixtureAdapter } from './adapter'
import { HttpAdapter } from './httpAdapter'
import { PoliticalHttpAdapter } from './politicalHttp'

export type AdapterMode = 'live' | 'demo'
export type RefreshAwareSourceAdapter = SourceAdapter & {
  readonly lastRefreshAt?: number | null
}
export type ModeAwareSourceAdapter = SourceAdapter & {
  readonly mode: AdapterMode
  readonly lastRefreshAt?: number | null
  readonly supportsLiveRefresh?: boolean
}

export class CombinedLiveAdapter implements SourceAdapter {
  readonly mode = 'live' as const

  constructor(private readonly adapters: readonly RefreshAwareSourceAdapter[]) {}

  get lastRefreshAt(): number | null {
    const refreshes = this.adapters
      .map((adapter) => adapter.lastRefreshAt)
      .filter((value): value is number => typeof value === 'number')
    return refreshes.length > 0 ? Math.max(...refreshes) : null
  }

  async searchNews(query: string): Promise<Candidate[]> {
    const results = await Promise.allSettled(
      this.adapters.map((adapter) => adapter.searchNews(query)),
    )
    const candidates = results.flatMap((result) =>
      result.status === 'fulfilled' ? result.value : [],
    )

    if (candidates.length === 0) {
      throw new Error('Aucune source réelle n’est disponible.')
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

  async searchNews(query: string) {
    try {
      const candidates = await this.live.searchNews(query)
      this.activeMode = 'live'
      return candidates
    } catch {
      this.activeMode = 'demo'
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
  const officialLiveHost = typeof window !== 'undefined' &&
    window.location.hostname === 'promesses-fantomes.vercel.app'
  return environment?.VITE_DEMO === '1' && !officialLiveHost
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
