import { describe, expect, it } from 'vitest'
import type { Candidate } from '../ai/types'
import { FixtureAdapter } from './adapter'
import { CombinedLiveAdapter, createAdapter } from './index'

const demoCandidate: Candidate = {
  title: 'Annonce fictive',
  sourceUrl: 'https://example.org/demo',
  excerpt: 'Scénario fictif.',
  publishedAt: '2026-11-13T10:00:00.000Z',
}

const liveCandidate: Candidate = {
  title: 'Annonce réelle',
  sourceUrl: 'https://presidence.cd/actualites',
  excerpt: 'Contenu public réel.',
  publishedAt: '2026-11-13T11:00:00.000Z',
}

describe('live source composition', () => {
  it('keeps successful live sources when another source fails', async () => {
    const combined = new CombinedLiveAdapter([
      { searchNews: () => Promise.reject(new Error('source down')) },
      { searchNews: () => Promise.resolve([liveCandidate]) },
    ])

    await expect(combined.searchNews('')).resolves.toEqual([liveCandidate])
  })

  it('recovers from a temporary live failure on the next refresh', async () => {
    let calls = 0
    const live = {
      searchNews: () => {
        calls += 1
        return calls === 1
          ? Promise.reject(new Error('temporary failure'))
          : Promise.resolve([liveCandidate])
      },
    }
    const adapter = createAdapter(
      false,
      live,
      new FixtureAdapter([demoCandidate]),
    )

    await expect(adapter.searchNews('')).resolves.toEqual([demoCandidate])
    expect(adapter.mode).toBe('demo')
    await expect(adapter.searchNews('')).resolves.toEqual([liveCandidate])
    expect(adapter.mode).toBe('live')
  })

  it('never calls live sources when fixture mode is explicit', async () => {
    let calls = 0
    const adapter = createAdapter(
      true,
      { searchNews: () => { calls += 1; return Promise.resolve([liveCandidate]) } },
      new FixtureAdapter([demoCandidate]),
    )

    await expect(adapter.searchNews('')).resolves.toEqual([demoCandidate])
    expect(calls).toBe(0)
  })
})
