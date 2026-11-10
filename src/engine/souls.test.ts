import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { settlePledge, type Side, type Stake } from './souls'

const sideArbitrary: fc.Arbitrary<Side> = fc.constantFrom('KEPT', 'BROKEN')
const stakeArbitrary: fc.Arbitrary<Stake> = fc.record({
  userId: fc.integer({ min: 1, max: 1_000_000 }).map(String),
  side: sideArbitrary,
  amount: fc.integer({ min: 1, max: 10_000 }),
  at: fc.integer({ min: 0, max: 1_000_000 }),
})
const stakesArbitrary = fc.array(stakeArbitrary, { minLength: 1, maxLength: 40 })

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

describe('settlePledge examples', () => {
  it('distributes remainder Souls to the earlier stake when remainders tie', () => {
    const stakes: Stake[] = [
      { userId: 'later', side: 'KEPT', amount: 1, at: 20 },
      { userId: 'earlier', side: 'KEPT', amount: 1, at: 10 },
      { userId: 'loser', side: 'BROKEN', amount: 1, at: 5 },
    ]

    expect(settlePledge(stakes, 'KEPT')).toEqual({
      kind: 'PAYOUT',
      payouts: [1, 2, 0],
    })
  })

  it('refunds every stake when nobody backed the winning side', () => {
    const stakes: Stake[] = [
      { userId: 'one', side: 'BROKEN', amount: 2, at: 1 },
      { userId: 'two', side: 'BROKEN', amount: 3, at: 2 },
    ]

    expect(settlePledge(stakes, 'KEPT')).toEqual({
      kind: 'REFUND',
      payouts: [2, 3],
    })
  })

  it('rejects non-positive and non-integer stake amounts', () => {
    const validStake = { userId: 'one', side: 'KEPT' as const, at: 1 }

    expect(() => settlePledge([{ ...validStake, amount: 0 }], 'KEPT')).toThrow()
    expect(() => settlePledge([{ ...validStake, amount: -1 }], 'KEPT')).toThrow()
    expect(() => settlePledge([{ ...validStake, amount: 1.5 }], 'KEPT')).toThrow()
  })
})

describe('settlePledge properties', () => {
  it('P1: preserves the total pool', () => {
    fc.assert(
      fc.property(stakesArbitrary, sideArbitrary, (stakes, winningSide) => {
        const settlement = settlePledge(stakes, winningSide)

        expect(sum(settlement.payouts)).toBe(sum(stakes.map((stake) => stake.amount)))
      }),
    )
  })

  it('P2: never pays a larger winning stake less than a smaller one', () => {
    fc.assert(
      fc.property(stakesArbitrary, sideArbitrary, (stakes, winningSide) => {
        const { payouts } = settlePledge(stakes, winningSide)
        const winnerIndexes = stakes
          .map((stake, index) => ({ stake, index }))
          .filter(({ stake }) => stake.side === winningSide)

        for (const larger of winnerIndexes) {
          for (const smaller of winnerIndexes) {
            if (larger.stake.amount > smaller.stake.amount) {
              expect(payouts[larger.index]).toBeGreaterThanOrEqual(payouts[smaller.index])
            }
          }
        }
      }),
    )
  })

  it('P3: protects winning stakes and returns them exactly without a losing pool', () => {
    fc.assert(
      fc.property(stakesArbitrary, sideArbitrary, (stakes, winningSide) => {
        const { payouts } = settlePledge(stakes, winningSide)
        const losingPool = sum(
          stakes.filter((stake) => stake.side !== winningSide).map((stake) => stake.amount),
        )

        stakes.forEach((stake, index) => {
          if (stake.side === winningSide) {
            expect(payouts[index]).toBeGreaterThanOrEqual(stake.amount)

            if (losingPool === 0) {
              expect(payouts[index]).toBe(stake.amount)
            }
          }
        })
      }),
    )
  })
})
