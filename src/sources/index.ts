import type { SourceAdapter } from './adapter'
import { FixtureAdapter } from './adapter'
import { HttpAdapter } from './httpAdapter'

export type AdapterMode = 'live' | 'demo'
export type ModeAwareSourceAdapter = SourceAdapter & {
  readonly mode: AdapterMode
}

class FallbackSourceAdapter implements ModeAwareSourceAdapter {
  private activeMode: AdapterMode = 'live'

  constructor(
    private readonly live: SourceAdapter,
    private readonly fallback: FixtureAdapter,
  ) {}

  get mode(): AdapterMode {
    return this.activeMode
  }

  async searchNews(query: string) {
    if (this.activeMode === 'demo') {
      return this.fallback.searchNews(query)
    }

    try {
      return await this.live.searchNews(query)
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
  return environment?.VITE_DEMO === '1'
}

export function createAdapter(
  demoMode = environmentDemoMode(),
  liveAdapter: SourceAdapter = new HttpAdapter(),
  fixtureAdapter = new FixtureAdapter(),
): ModeAwareSourceAdapter {
  if (demoMode) {
    return fixtureAdapter
  }

  return new FallbackSourceAdapter(liveAdapter, fixtureAdapter)
}

export { FixtureAdapter, HttpAdapter }
export type { SourceAdapter }
