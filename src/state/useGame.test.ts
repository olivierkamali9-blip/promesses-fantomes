import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import type { DemoPledge } from '../data/demoPledges'
import {
  evidenceLevel,
  type ProposedOutcome,
  type Source,
} from '../engine/evidence'
import type { Side } from '../engine/souls'
import {
  createInitialGameState,
  gameReducer,
  type GameState,
} from './useGame'

const sideArbitrary: fc.Arbitrary<Side> = fc.constantFrom('KEPT', 'BROKEN')
const outcomeArbitrary: fc.Arbitrary<ProposedOutcome> = fc.constantFrom(
  'KEPT',
  'BROKEN',
)

const lowEvidenceSourcesArbitrary: fc.Arbitrary<Source[]> = fc.constantFrom(
  [],
  [
    {
      url: 'https://example.org/statement',
      kind: 'statement',
      independentGroup: 'speaker',
    },
  ],
  [
    {
      url: 'https://example.org/reliable',
      kind: 'reliable',
      independentGroup: 'newsroom',
    },
  ],
  [
    {
      url: 'https://example.org/reliable-a',
      kind: 'reliable',
      independentGroup: 'same-newsroom',
    },
    {
      url: 'https://example.org/reliable-b',
      kind: 'reliable',
      independentGroup: 'same-newsroom',
    },
  ],
)

function stateWithPledge(
  sources: Source[],
  pools: Readonly<Record<Side, number>>,
): GameState {
  const initial = createInitialGameState()
  const base = initial.pledges[0]
  const pledge: DemoPledge = {
    ...base,
    state: 'APPARITION',
    evidenceLevel: evidenceLevel(sources),
    stakes: pools,
    sources: sources.map((source, index) => ({
      ...source,
      label: `Source fictive ${index + 1}`,
    })),
  }

  return { ...initial, pledges: [pledge] }
}

function simulate(
  initial: GameState,
  amount: number,
  side: Side,
  proposedOutcome: ProposedOutcome,
): GameState {
  const pledgeId = initial.pledges[0].id
  const staked = gameReducer(initial, {
    type: 'STAKE',
    pledgeId,
    side,
    amount,
    at: 100,
  })

  return gameReducer(staked, {
    type: 'SIMULATE_RESOLUTION',
    pledgeId,
    proposedOutcome,
  })
}

describe('simulated resolution properties', () => {
  it('conserves all player Souls plus the unpaid pool', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 1_000 }),
        fc.integer({ min: 1, max: 10_000 }),
        fc.integer({ min: 1, max: 10_000 }),
        sideArbitrary,
        outcomeArbitrary,
        fc.boolean(),
        (amount, keptPool, brokenPool, side, proposedOutcome, canResolve) => {
          const sources: Source[] = canResolve
            ? [
                {
                  url: 'https://example.org/official-demo',
                  kind: 'official',
                  independentGroup: 'official-demo',
                },
              ]
            : [
                {
                  url: 'https://example.org/statement-demo',
                  kind: 'statement',
                  independentGroup: 'statement-demo',
                },
              ]
          const initial = stateWithPledge(sources, {
            KEPT: keptPool,
            BROKEN: brokenPool,
          })
          const resolved = simulate(initial, amount, side, proposedOutcome)
          const result = resolved.resolutions[initial.pledges[0].id]
          const fictionalPayouts = result.payouts
            .filter((payout) => payout.fictional)
            .reduce((total, payout) => total + payout.payout, 0)
          const totalBefore = initial.player.souls + keptPool + brokenPool
          const totalAfter =
            resolved.player.souls + fictionalPayouts + result.unpaidPool

          expect(totalAfter).toBe(totalBefore)
        },
      ),
    )
  })

  it('refunds every stake as inconclusive below evidence level 3', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 1_000 }),
        sideArbitrary,
        outcomeArbitrary,
        lowEvidenceSourcesArbitrary,
        (amount, side, proposedOutcome, sources) => {
          const initial = stateWithPledge(
            sources,
            { KEPT: 720, BROKEN: 480 },
          )
          const resolved = simulate(initial, amount, side, proposedOutcome)
          const result = resolved.resolutions[initial.pledges[0].id]

          expect(result.outcome).toBe('INCONCLUSIVE')
          expect(result.settlementKind).toBe('REFUND')
          result.payouts.forEach((payout) => {
            expect(payout.payout).toBe(payout.stake)
          })
        },
      ),
    )
  })
})
