import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { totalStakedOnDay, validateStake } from './stake'

describe('validateStake examples', () => {
  it('rejects non-integers, amounts below 10, amounts above balance, and daily cap excess', () => {
    expect(validateStake(100, 10.5)).toEqual({ ok: false, reason: 'NOT_INTEGER' })
    expect(validateStake(100, 9)).toEqual({ ok: false, reason: 'BELOW_MINIMUM' })
    expect(validateStake(100, 101)).toEqual({ ok: false, reason: 'ABOVE_BALANCE' })
    expect(validateStake(1_000, 100, 450, 500)).toEqual({
      ok: false,
      reason: 'DAILY_CAP_EXCEEDED',
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
          const validation = validateStake(balance, amount, 0, 2_000_000)
          if (validation.ok) {
            expect(Number.isInteger(amount)).toBe(true)
            expect(amount).toBeGreaterThanOrEqual(10)
            expect(amount).toBeLessThanOrEqual(balance)
          }
        },
      ),
    )
  })

  it('accepts the exact remaining allowance and rejects one Soul more', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 5_000 }),
        fc.nat({ max: 1_000_000 }),
        (cap, seed) => {
          const stakedToday = seed % (cap - 9)
          const remaining = cap - stakedToday

          expect(validateStake(cap, remaining, stakedToday, cap).ok).toBe(true)
          expect(validateStake(cap + 1, remaining + 1, stakedToday, cap)).toEqual({
            ok: false,
            reason: 'DAILY_CAP_EXCEEDED',
          })
        },
      ),
    )
  })

  it('never lets the total stakes of the day exceed the cap', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 10, max: 500 }), { maxLength: 30 }),
        fc.integer({ min: 10, max: 5_000 }),
        fc.integer({ min: 10, max: 1_000 }),
        (amounts, cap, nextAmount) => {
          const noon = new Date(2026, 10, 13, 12).getTime()
          const stakes = amounts.map((amount, index) => ({
            amount,
            at: noon + index,
          }))
          const stakedToday = totalStakedOnDay(stakes, noon)
          const validation = validateStake(
            Number.MAX_SAFE_INTEGER,
            nextAmount,
            stakedToday,
            cap,
          )

          if (validation.ok) {
            expect(stakedToday + nextAmount).toBeLessThanOrEqual(cap)
          }
        },
      ),
    )
  })
})
