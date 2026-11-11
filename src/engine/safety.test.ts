import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { BLOCKED_KEYWORDS } from './safety.rules'
import {
  approvalPolicy,
  classifyByRules,
  mergeTier,
  type SafetyTier,
} from './safety'

const tierArbitrary: fc.Arbitrary<SafetyTier> = fc.constantFrom(
  'GREEN',
  'ORANGE',
  'RED',
  'BLOCKED',
)
const blockedKeywordArbitrary = fc.constantFrom(...BLOCKED_KEYWORDS)
const tierOrder: Record<SafetyTier, number> = {
  GREEN: 0,
  ORANGE: 1,
  RED: 2,
  BLOCKED: 3,
}

describe('safety examples', () => {
  it('matches accented keywords without case sensitivity', () => {
    expect(classifyByRules('La prochaine Élection aura lieu bientôt').tier).toBe(
      'RED',
    )
  })

  it('gives blocked rules priority over red and orange rules', () => {
    expect(
      classifyByRules('Un ministre parle de guerre et appelle à tuer').tier,
    ).toBe('BLOCKED')
  })

  it('classifies orange and green text', () => {
    expect(classifyByRules('The celebrity made a pledge').tier).toBe('ORANGE')
    expect(classifyByRules('Le club jouera la finale samedi').tier).toBe('GREEN')
  })

  it('returns the product approval policies', () => {
    expect(approvalPolicy('GREEN')).toEqual({
      autoPublish: true,
      needsApprovalBeforePublish: false,
      needsApprovalToResolve: false,
    })
    expect(approvalPolicy('ORANGE')).toEqual({
      autoPublish: true,
      needsApprovalBeforePublish: false,
      needsApprovalToResolve: true,
    })
    expect(approvalPolicy('RED')).toEqual({
      autoPublish: false,
      needsApprovalBeforePublish: true,
      needsApprovalToResolve: true,
    })
    expect(approvalPolicy('BLOCKED')).toEqual({
      autoPublish: false,
      needsApprovalBeforePublish: false,
      needsApprovalToResolve: false,
    })
  })
})

describe('safety properties', () => {
  it('P7: mergeTier never returns a tier lower than the rule tier', () => {
    fc.assert(
      fc.property(tierArbitrary, tierArbitrary, (ruleTier, modelTier) => {
        expect(tierOrder[mergeTier(ruleTier, modelTier)]).toBeGreaterThanOrEqual(
          tierOrder[ruleTier],
        )
      }),
    )
  })

  it('always blocks text containing a blocked keyword', () => {
    fc.assert(
      fc.property(
        fc.string(),
        blockedKeywordArbitrary,
        fc.string(),
        (prefix, keyword, suffix) => {
          expect(classifyByRules(`${prefix} ${keyword} ${suffix}`).tier).toBe(
            'BLOCKED',
          )
        },
      ),
    )
  })

  it('mergeTier is commutative', () => {
    fc.assert(
      fc.property(tierArbitrary, tierArbitrary, (firstTier, secondTier) => {
        expect(mergeTier(firstTier, secondTier)).toBe(
          mergeTier(secondTier, firstTier),
        )
      }),
    )
  })

  it('mergeTier is idempotent', () => {
    fc.assert(
      fc.property(tierArbitrary, (tier) => {
        expect(mergeTier(tier, tier)).toBe(tier)
      }),
    )
  })
})
