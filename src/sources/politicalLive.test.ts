import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { decide } from '../ai/guardian'
import {
  draftPoliticalStatement,
  politicalCandidateFromStatement,
  statementDeadline,
} from './politicalLive'

const NOW = Date.parse('2026-11-13T12:00:00.000Z')
const SOURCE = {
  url: 'https://presidence.cd/actualite-detail/actualite/engagement-exemple',
  name: 'Présidence Exemple',
  independentGroup: 'presidence-exemple',
  publishedAt: '2026-11-13T10:00:00.000Z',
}

describe('political statement monitoring', () => {
  it('keeps the exact sourced statement and drafts it as ORANGE', () => {
    const statement = "Le président s'engage à publier le rapport avant le 31 décembre 2099."
    const candidate = politicalCandidateFromStatement(statement, SOURCE, NOW)
    expect(candidate?.exactStatement).toBe(statement)

    const draft = draftPoliticalStatement(candidate!)
    const decision = decide(draft)
    expect(draft.modelTier).toBe('ORANGE')
    expect(decision.tier).toBe('ORANGE')
    expect(decision.action).toBe('PUBLISH')
  })

  it('rejects text without an attributable future commitment', () => {
    expect(politicalCandidateFromStatement('Une rumeur sans source ni date.', SOURCE, NOW)).toBeNull()
    expect(statementDeadline('Le président promet un rapport avant 2025.', NOW)).toBeNull()
  })

  it('never fabricates a statement from arbitrary text', () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const candidate = politicalCandidateFromStatement(text, SOURCE, NOW)
        if (candidate) {
          expect(text.replace(/\s+/g, ' ').trim()).toBe(candidate.exactStatement)
        }
      }),
    )
  })
})
