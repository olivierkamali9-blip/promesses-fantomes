import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { evidenceLevel } from '../engine/evidence'
import { decide } from '../ai/guardian'
import {
  confirmResult,
  draftLiveFootball,
  footballMatchesToCandidates,
  normalizeFootballData,
  normalizeOpenFootball,
  openFootballSeasonFolder,
  sameTeam,
  selectLiveFootballCandidates,
  type LiveMatch,
} from './footballLive'

const scoreArbitrary = fc.tuple(
  fc.integer({ min: 0, max: 20 }),
  fc.integer({ min: 0, max: 20 }),
)

function finishedMatch(
  scoreFt: [number, number],
  sourceName: string,
): LiveMatch {
  return {
    competition: 'Premier League',
    kickoffUtc: '2025-08-16T14:00:00.000Z',
    home: 'Étoile FC',
    away: 'AFC Rivière',
    status: 'FINISHED',
    scoreFt,
    sourceName,
  }
}

describe('football live normalizers', () => {
  it('normalizes football-data.org and ignores malformed matches', () => {
    const matches = normalizeFootballData({
      competition: { name: 'Premier League' },
      matches: [
        {
          utcDate: '2025-08-16T14:00:00Z',
          status: 'FINISHED',
          homeTeam: { name: 'Étoile FC' },
          awayTeam: { name: 'Rivière AFC' },
          score: { fullTime: { home: 2, away: 1 } },
        },
        { utcDate: 12, homeTeam: null },
        null,
      ],
    })

    expect(matches).toEqual([
      {
        competition: 'Premier League',
        kickoffUtc: '2025-08-16T14:00:00.000Z',
        home: 'Étoile FC',
        away: 'Rivière AFC',
        status: 'FINISHED',
        scoreFt: [2, 1],
        sourceName: 'football-data.org',
      },
    ])
    expect(normalizeFootballData(null)).toEqual([])
    expect(normalizeFootballData({ matches: 'bad json' })).toEqual([])
  })

  it('uses only score.ft from openfootball and ignores a bare score array', () => {
    const normalized = normalizeOpenFootball({
      name: 'Premier League',
      matches: [
        {
          date: '2025-08-16',
          time: '14:00',
          team1: 'Étoile FC',
          team2: 'Rivière AFC',
          score: { ft: [2, 1] },
        },
        {
          date: '2025-08-17',
          time: '16:30',
          team1: 'Club Nord',
          team2: 'Club Sud',
          score: [3, 0],
        },
        { date: 'not-a-date', time: {}, team1: [], team2: null },
      ],
    })

    expect(normalized).toHaveLength(2)
    expect(normalized[0]).toMatchObject({ status: 'FINISHED', scoreFt: [2, 1] })
    expect(normalized[1]).toMatchObject({ status: 'SCHEDULED', scoreFt: null })
    expect(normalizeOpenFootball('{ bad json')).toEqual([])
  })
})

describe('football result confirmation', () => {
  it('accepts matching scores from two independent providers', () => {
    const result = confirmResult(
      finishedMatch([2, 1], 'football-data.org'),
      finishedMatch([2, 1], 'openfootball'),
    )

    expect(result.conflict).toBe(false)
    expect(result.sources).toEqual([
      {
        url: 'https://www.football-data.org/',
        kind: 'reliable',
        independentGroup: 'football-data',
      },
      {
        url: 'https://github.com/openfootball/football.json',
        kind: 'reliable',
        independentGroup: 'openfootball',
      },
    ])
    expect(evidenceLevel(result.sources)).toBe(3)
  })

  it('keeps a single reliable provider at evidence level 2', () => {
    const result = confirmResult(
      finishedMatch([2, 1], 'football-data.org'),
      undefined,
    )

    expect(result.conflict).toBe(false)
    expect(result.sources).toHaveLength(1)
    expect(evidenceLevel(result.sources)).toBe(2)
  })

  it('matches names without accents, punctuation, or club suffixes', () => {
    expect(sameTeam('Étoile F.C.', 'etoile AFC')).toBe(true)
  })
})

describe('OpenFootball season folders', () => {
  it('expands start years and preserves complete season folders', () => {
    expect(openFootballSeasonFolder('2025')).toBe('2025-26')
    expect(openFootballSeasonFolder('2026')).toBe('2026-27')
    expect(openFootballSeasonFolder('2025-26')).toBe('2025-26')
  })

  it('maps every valid start year to the following two-digit year', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1900, max: 9998 }), (year) => {
        const expectedEnd = String(year + 1).slice(-2)
        expect(openFootballSeasonFolder(String(year))).toBe(
          `${year}-${expectedEnd}`,
        )
      }),
    )
  })
})

describe('football candidate selection', () => {
  it('uses the nearest future fixtures when the next seven days are empty', () => {
    const now = Date.parse('2026-11-13T09:00:00.000Z')
    const matches: LiveMatch[] = [8, 9].map((days, index) => ({
      competition: 'Premier League',
      kickoffUtc: new Date(now + days * 24 * 60 * 60 * 1_000).toISOString(),
      home: `Home ${index}`,
      away: `Away ${index}`,
      status: 'SCHEDULED',
      scoreFt: null,
      sourceName: 'football-data.org',
    }))

    const selected = selectLiveFootballCandidates(
      footballMatchesToCandidates(matches),
      now,
    )
    expect(selected).toHaveLength(2)
    expect(selected.every((candidate) => candidate.phase === 'UPCOMING')).toBe(true)
  })
})

describe('football live properties', () => {
  it('never throws while normalizing arbitrary JSON values', () => {
    fc.assert(
      fc.property(fc.jsonValue(), (value) => {
        expect(() => normalizeFootballData(value)).not.toThrow()
        expect(() => normalizeOpenFootball(value)).not.toThrow()
      }),
    )
  })

  it('compares team names symmetrically', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (left, right) => {
        expect(sameTeam(left, right)).toBe(sameTeam(right, left))
      }),
    )
  })

  it('never creates two independent reliable sources when either match is missing', () => {
    fc.assert(
      fc.property(
        scoreArbitrary,
        fc.constantFrom('first', 'second', 'both'),
        (score, missing) => {
          const footballData = missing === 'first' || missing === 'both'
            ? null
            : finishedMatch(score, 'football-data.org')
          const openFootball = missing === 'second' || missing === 'both'
            ? undefined
            : finishedMatch(score, 'openfootball')
          const result = confirmResult(footballData, openFootball)

          expect(result.sources.length).toBeLessThan(2)
          expect(evidenceLevel(result.sources)).toBeLessThan(3)
        },
      ),
    )
  })

  it('keeps publishable real-match drafts GREEN', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10_000 }),
        fc.integer({ min: 10_001, max: 20_000 }),
        (homeId, awayId) => {
          const kickoffUtc = '2099-08-16T14:00:00.000Z'
          const scheduled = [
            {
              competition: 'Premier League',
              kickoffUtc,
              home: `Home ${homeId}`,
              away: `Away ${awayId}`,
              status: 'SCHEDULED' as const,
              scoreFt: null,
              sourceName: 'football-data.org',
            },
            {
              competition: 'Premier League',
              kickoffUtc,
              home: `Home ${homeId}`,
              away: `Away ${awayId}`,
              status: 'SCHEDULED' as const,
              scoreFt: null,
              sourceName: 'openfootball',
            },
          ]
          const candidate = footballMatchesToCandidates(scheduled)[0]
          const draft = draftLiveFootball(candidate)
          const decision = decide(draft)

          expect(evidenceLevel(candidate.evidenceSources)).toBe(3)
          expect(decision.tier).toBe('GREEN')
          expect(decision.action).toBe('PUBLISH')
        },
      ),
    )
  })

  it('returns no resolvable evidence when final scores conflict', () => {
    fc.assert(
      fc.property(scoreArbitrary, (score) => {
        const conflicting: [number, number] = [score[0] + 1, score[1]]
        const result = confirmResult(
          finishedMatch(score, 'football-data.org'),
          finishedMatch(conflicting, 'openfootball'),
        )

        expect(result.conflict).toBe(true)
        expect(result.sources).toEqual([])
        expect(evidenceLevel(result.sources)).toBeLessThan(3)
      }),
    )
  })
})
