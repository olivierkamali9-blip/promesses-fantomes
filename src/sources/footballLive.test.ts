import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { evidenceLevel } from '../engine/evidence'
import {
  confirmResult,
  normalizeFootballData,
  normalizeOpenFootball,
  sameTeam,
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

  it('matches names without accents, punctuation, or club suffixes', () => {
    expect(sameTeam('Étoile F.C.', 'etoile AFC')).toBe(true)
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
