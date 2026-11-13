import { describe, expect, it } from 'vitest'
import { HttpAdapter } from './httpAdapter'

describe('HttpAdapter partial provider availability', () => {
  it('keeps real upcoming matches when one provider reports a warning', async () => {
    const now = Date.parse('2026-11-13T12:00:00.000Z')
    const kickoff = '2026-11-14T15:00:00.000Z'
    const adapter = new HttpAdapter({
      mode: 'upcoming',
      season: '2026',
      now: () => now,
      storage: null,
      fetcher: async () => new Response(JSON.stringify({
        matches: [{
          competition: 'Premier League',
          kickoffUtc: kickoff,
          home: 'Home Club',
          away: 'Away Club',
          status: 'SCHEDULED',
          scoreFt: null,
          sourceName: 'openfootball',
        }],
        warnings: ['football-data.org est momentanément indisponible.'],
        fetchedAt: '2026-11-13T12:00:00.000Z',
      }), { status: 200 }),
    })

    const candidates = await adapter.searchNews('')
    expect(candidates).toHaveLength(1)
    expect(candidates[0]).toMatchObject({
      candidateKind: 'live-football',
      phase: 'UPCOMING',
      publishedAt: kickoff,
    })
  })
})
