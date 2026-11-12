import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import type { Source } from '../engine/evidence'
import { RED_KEYWORDS } from '../engine/safety.rules'
import {
  classifyByRules,
  type SafetyTier,
} from '../engine/safety'
import { FixtureAdapter } from '../sources/adapter'
import { FIXTURE_NEWS } from '../sources/fixtures'
import { draftPledge } from './drafter'
import { decide } from './guardian'
import { FixtureLlm, type LlmClient } from './llm'
import { scout } from './scout'
import type { Draft } from './types'

const FUTURE_DEADLINE = '2099-12-31T18:00:00.000Z'
const SOURCE: Source = {
  url: 'https://example.org/source/test',
  kind: 'statement',
  independentGroup: 'fixture-test',
}
const TIER_ORDER: Record<SafetyTier, number> = {
  GREEN: 0,
  ORANGE: 1,
  RED: 2,
  BLOCKED: 3,
}

function validDraft(overrides: Partial<Draft> = {}): Draft {
  return {
    question: 'Le club fictif gagnera-t-il le match ?',
    criteria: 'La feuille de match désigne le club fictif vainqueur.',
    deadline: FUTURE_DEADLINE,
    sides: {
      kept: {
        argument: 'Le match est inscrit au calendrier fictif.',
        sourceUrl: SOURCE.url,
      },
      broken: {
        argument: 'Le résultat reste incertain.',
        sourceUrl: SOURCE.url,
      },
    },
    sources: [SOURCE],
    modelTier: 'GREEN',
    ...overrides,
  }
}

function safetyText(draft: Draft): string {
  return [
    draft.question,
    draft.criteria,
    draft.sides.kept.argument,
    draft.sides.broken.argument,
  ].join(' ')
}

describe('AI adapter examples', () => {
  it('scouts the six fictional fixtures and filters them by query', async () => {
    const adapter = new FixtureAdapter()

    await expect(scout(adapter, '')).resolves.toHaveLength(6)
    const matches = await scout(adapter, 'Archipel Azur')
    expect(matches).toEqual([FIXTURE_NEWS[4]])
  })

  it('drafts deterministic JSON and raises a GREEN model answer to RED', async () => {
    const draft = await draftPledge(new FixtureLlm(), FIXTURE_NEWS[4])

    expect(draft.modelTier).toBe('RED')
    expect(draft.sources[0]?.url).toBe(FIXTURE_NEWS[4].sourceUrl)
    expect(decide(draft).action).toBe('QUEUE_APPROVAL')
  })

  it('rejects invalid JSON returned by an LLM', async () => {
    const invalidLlm: LlmClient = {
      complete: () => Promise.resolve('{not-json'),
    }

    await expect(draftPledge(invalidLlm, FIXTURE_NEWS[0])).rejects.toThrow(
      'Invalid JSON returned by the LLM.',
    )
  })

  it('applies GREEN, ORANGE, RED, and BLOCKED publication policies', () => {
    expect(decide(validDraft()).action).toBe('PUBLISH')

    const orange = decide(
      validDraft({
        question: 'La mairie fictive tiendra-t-elle sa promesse ?',
        modelTier: 'ORANGE',
      }),
    )
    expect(orange.action).toBe('PUBLISH')
    expect(orange.reason).toContain('UNCONFIRMED')

    expect(
      decide(
        validDraft({
          question: 'Le tableau de l’élection fictive sera-t-il publié ?',
          modelTier: 'RED',
        }),
      ).action,
    ).toBe('QUEUE_APPROVAL')

    expect(
      decide(
        validDraft({
          question: 'Cette religion fictive gagnera-t-elle le match ?',
          modelTier: 'BLOCKED',
        }),
      ).action,
    ).toBe('REJECT')
  })
})

describe('AI adapter properties', () => {
  it('P6: a draft missing criteria, a future deadline, or sources is never published', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('criteria', 'deadline', 'sources'),
        fc.string(),
        (missingField, argument) => {
          const draft = validDraft({
            sides: {
              kept: { argument, sourceUrl: SOURCE.url },
              broken: { argument, sourceUrl: SOURCE.url },
            },
            ...(missingField === 'criteria' ? { criteria: '' } : {}),
            ...(missingField === 'deadline' ? { deadline: '' } : {}),
            ...(missingField === 'sources' ? { sources: [] } : {}),
          })

          expect(decide(draft).action).toBe('REJECT')
        },
      ),
    )
  })

  it('P7: the Guardian tier never falls below the rule tier', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...RED_KEYWORDS),
        fc.string(),
        (redKeyword, suffix) => {
          const draft = validDraft({
            question: `${redKeyword} ${suffix}`,
            modelTier: 'GREEN',
          })
          const ruleTier = classifyByRules(safetyText(draft)).tier
          const decision = decide(draft)

          expect(TIER_ORDER[decision.tier]).toBeGreaterThanOrEqual(
            TIER_ORDER[ruleTier],
          )
        },
      ),
    )
  })
})
