import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import type { EvidenceLevel } from '../engine/evidence'
import type { SafetyTier } from '../engine/safety'
import { decideResolution } from './consensus'
import {
  VERIFIER_NAMES,
  type VerifierCheck,
  type VerifierOutcome,
} from './verifier'

function agreeingChecks(
  outcome: Exclude<VerifierOutcome, 'INCONCLUSIVE'>,
  confidence: number,
): VerifierCheck[] {
  return VERIFIER_NAMES.map((name) => ({
    name,
    outcome,
    confidence,
    reasons: ['Preuve fictive vérifiée.'],
  }))
}

const outcomeArbitrary = fc.constantFrom<'KEPT' | 'BROKEN'>('KEPT', 'BROKEN')
const highConfidenceArbitrary = fc.double({
  min: 0.8,
  max: 1,
  noNaN: true,
})

describe('three-spirit consensus properties', () => {
  it('never auto-resolves below evidence level 3', () => {
    fc.assert(
      fc.property(
        outcomeArbitrary,
        highConfidenceArbitrary,
        fc.integer({ min: 0, max: 2 }),
        (outcome, confidence, level) => {
          const decision = decideResolution(
            agreeingChecks(outcome, confidence),
            level as EvidenceLevel,
            'GREEN',
          )

          expect(decision.action).toBe('HUMAN_REVIEW')
        },
      ),
    )
  })

  it('never auto-resolves when the checks disagree', () => {
    fc.assert(
      fc.property(outcomeArbitrary, highConfidenceArbitrary, (outcome, confidence) => {
        const opposite = outcome === 'KEPT' ? 'BROKEN' : 'KEPT'
        const checks = agreeingChecks(outcome, confidence)
        checks[2] = { ...checks[2], outcome: opposite }

        expect(decideResolution(checks, 4, 'GREEN').action).toBe('HUMAN_REVIEW')
      }),
    )
  })

  it('never auto-resolves an ORANGE or RED pledge', () => {
    fc.assert(
      fc.property(
        outcomeArbitrary,
        highConfidenceArbitrary,
        fc.constantFrom<SafetyTier>('ORANGE', 'RED'),
        (outcome, confidence, tier) => {
          expect(
            decideResolution(agreeingChecks(outcome, confidence), 4, tier).action,
          ).toBe('HUMAN_REVIEW')
        },
      ),
    )
  })

  it('never auto-resolves with low mean confidence or an inconclusive check', () => {
    fc.assert(
      fc.property(
        outcomeArbitrary,
        fc.double({ min: 0, max: 0.79, noNaN: true }),
        (outcome, confidence) => {
          expect(
            decideResolution(agreeingChecks(outcome, confidence), 4, 'GREEN')
              .action,
          ).toBe('HUMAN_REVIEW')

          const checks = agreeingChecks(outcome, 0.95)
          checks[1] = { ...checks[1], outcome: 'INCONCLUSIVE' }
          expect(decideResolution(checks, 4, 'GREEN').action).toBe(
            'HUMAN_REVIEW',
          )
        },
      ),
    )
  })
})
