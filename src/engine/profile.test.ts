import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { calculateProphetRank } from './profile'

describe('calculateProphetRank properties', () => {
  it('stays between 0 and 100', () => {
    fc.assert(
      fc.property(fc.array(fc.boolean()), (results) => {
        const rank = calculateProphetRank(results)
        expect(rank.percentage).toBeGreaterThanOrEqual(0)
        expect(rank.percentage).toBeLessThanOrEqual(100)
      }),
    )
  })

  it('never decreases when a win is added', () => {
    fc.assert(
      fc.property(fc.array(fc.boolean()), (results) => {
        const before = calculateProphetRank(results)
        const after = calculateProphetRank([...results, true])
        expect(after.percentage).toBeGreaterThanOrEqual(before.percentage)
      }),
    )
  })
})
