import { describe, expect, it } from 'vitest'
import { demoPledges } from '../data/demoPledges'
import { FixtureLlm } from './llm'
import { runVerifiers, VERIFIER_NAMES } from './verifier'

describe('fixture verifiers', () => {
  it('returns three named deterministic checks for a demo pledge', async () => {
    const pledge = demoPledges[0]
    const first = await runVerifiers(pledge, pledge.sources, new FixtureLlm())
    const second = await runVerifiers(pledge, pledge.sources, new FixtureLlm())

    expect(first).toEqual(second)
    expect(first.map((check) => check.name)).toEqual([...VERIFIER_NAMES])
    first.forEach((check) => {
      expect(check.confidence).toBeGreaterThanOrEqual(0)
      expect(check.confidence).toBeLessThanOrEqual(1)
      expect(check.reasons.length).toBeGreaterThan(0)
    })
  })
})
