import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { validateStake } from './stake'

describe('validateStake examples', () => {
  it('rejects non-integers, amounts below 10, and amounts above the balance', () => {
    expect(validateStake(100, 10.5)).toEqual({
      ok: false,
      reason: 'NOT_INTEGER',
    })
    expect(validateStake(100, 9)).toEqual({
      ok: false,
      reason: 'BELOW_MINIMUM',
    })
    expect(validateStake(100, 101)).toEqual({
      ok: false,
      reason: 'ABOVE_BALANCE',
    })
  })
})

describe('validateStake properties', () => {
  it('never accepts an amount above the balance', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 1, max: 1_000_000 }),
        (balance, excess) => {
          expect(validateStake(balance, balance + excess).ok).toBe(false)
        },
      ),
    )
  })

  it('accepts only integers between 10 and the balance', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.oneof(
          fc.integer({ min: -1_000_000, max: 2_000_000 }),
          fc.double({ noNaN: true, noDefaultInfinity: true }),
        ),
        (balance, amount) => {
          const validation = validateStake(balance, amount)

          if (validation.ok) {
            expect(Number.isInteger(amount)).toBe(true)
            expect(amount).toBeGreaterThanOrEqual(10)
            expect(amount).toBeLessThanOrEqual(balance)
          }
        },
      ),
    )
  })
})
