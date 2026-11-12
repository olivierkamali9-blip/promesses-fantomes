import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { decide } from '../ai/guardian'
import type { Draft } from '../ai/types'
import { VERIFIER_NAMES, type VerifierCheck } from '../ai/verifier'
import type { DemoPledge } from '../data/demoPledges'
import {
  evidenceLevel,
  type ProposedOutcome,
  type Source,
} from '../engine/evidence'
import type { FinalState } from '../engine/lifecycle'
import type { SafetyTier } from '../engine/safety'
import type { Side } from '../engine/souls'
import {
  createInitialGameState,
  gameReducer,
  type DraftQueueItem,
  type GameAction,
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


const tierArbitrary: fc.Arbitrary<SafetyTier> = fc.constantFrom(
  'GREEN',
  'ORANGE',
  'RED',
  'BLOCKED',
)

const editedQuestionArbitrary = fc.constantFrom(
  'Le club gagnera-t-il le match annoncé ?',
  'La mairie tiendra-t-elle cette promesse ?',
  'Le tableau de l’élection sera-t-il publié ?',
  'Cette religion sera-t-elle mentionnée ?',
)

type WorkflowActionName =
  | 'GENERATE_DRAFTS'
  | 'APPROVE_DRAFT'
  | 'EDIT_DRAFT'
  | 'REJECT_DRAFT'

type DraftReviewActionName = Exclude<WorkflowActionName, 'GENERATE_DRAFTS'>

const workflowActionArbitrary: fc.Arbitrary<WorkflowActionName> = fc.constantFrom(
  'GENERATE_DRAFTS',
  'APPROVE_DRAFT',
  'EDIT_DRAFT',
  'REJECT_DRAFT',
)

const draftReviewActionArbitrary: fc.Arbitrary<DraftReviewActionName> =
  fc.constantFrom('APPROVE_DRAFT', 'EDIT_DRAFT', 'REJECT_DRAFT')

function reviewItem(
  tier: SafetyTier,
  id = `property-${tier.toLowerCase()}`,
): DraftQueueItem {
  const draft: Draft = {
    question: 'Le club gagnera-t-il le match annoncé ?',
    criteria: 'La feuille de match fictive désigne le club vainqueur.',
    deadline: '2099-12-31T18:00:00.000Z',
    sides: {
      kept: {
        argument: 'Le match est inscrit au calendrier.',
        sourceUrl: 'https://example.org/property-source',
      },
      broken: {
        argument: 'Le calendrier ne garantit pas le résultat.',
        sourceUrl: 'https://example.org/property-source',
      },
    },
    sources: [
      {
        url: 'https://example.org/property-source',
        kind: 'reliable',
        independentGroup: 'property-source',
      },
    ],
    modelTier: tier,
  }

  return {
    id,
    candidate: {
      title: 'Candidat fictif de propriété',
      sourceUrl: 'https://example.org/property-source',
      excerpt: 'Scénario fictif.',
      publishedAt: '2026-01-01T00:00:00.000Z',
    },
    draft,
    decision: decide(draft),
    createdAt: 1,
  }
}

function workflowAction(
  name: WorkflowActionName,
  item: DraftQueueItem,
  at: number,
): GameAction {
  if (name === 'GENERATE_DRAFTS') {
    return { type: name, drafts: [item], at }
  }
  if (name === 'APPROVE_DRAFT') {
    return { type: name, draftId: item.id, at }
  }
  if (name === 'EDIT_DRAFT') {
    return {
      type: name,
      draftId: item.id,
      edits: {
        question: 'Le club gagnera-t-il le match modifié ?',
        criteria: item.draft.criteria,
        deadline: item.draft.deadline,
      },
      at,
    }
  }
  return {
    type: name,
    draftId: item.id,
    reason: 'Décision humaine motivée.',
    at,
  }
}

describe('approval queue properties', () => {
  it('never lets a BLOCKED draft reach the feed in any action sequence', () => {
    fc.assert(
      fc.property(
        fc.array(workflowActionArbitrary, { maxLength: 40 }),
        (actionNames) => {
          const blocked = reviewItem('BLOCKED')
          let state = gameReducer(createInitialGameState(), {
            type: 'GENERATE_DRAFTS',
            drafts: [blocked],
            at: 1,
          })

          actionNames.forEach((name, index) => {
            state = gameReducer(state, workflowAction(name, blocked, index + 2))
            expect(state.pledges.some((pledge) => pledge.id === blocked.id)).toBe(false)
          })

          expect(
            state.decisionsLog.some((entry) =>
              entry.subjects.some(
                (subject) =>
                  subject.draftId === blocked.id && subject.tier === 'BLOCKED',
              ),
            ),
          ).toBe(true)
        },
      ),
    )
  })

  it('never lowers the tier when a human edits a draft', () => {
    const tierOrder: Record<SafetyTier, number> = {
      GREEN: 0,
      ORANGE: 1,
      RED: 2,
      BLOCKED: 3,
    }

    fc.assert(
      fc.property(tierArbitrary, editedQuestionArbitrary, (tier, question) => {
        const item = reviewItem(tier)
        const initial: GameState = {
          ...createInitialGameState(),
          draftsQueue: [item],
        }
        const edited = gameReducer(initial, {
          type: 'EDIT_DRAFT',
          draftId: item.id,
          edits: {
            question,
            criteria: item.draft.criteria,
            deadline: item.draft.deadline,
          },
          at: 2,
        })
        const loggedTier = edited.decisionsLog[0].subjects[0].tier

        expect(tierOrder[loggedTier]).toBeGreaterThanOrEqual(
          tierOrder[item.decision.tier],
        )
      }),
    )
  })

  it('leaves the state unchanged when a review action targets an unknown draft', () => {
    fc.assert(
      fc.property(
        draftReviewActionArbitrary,
        fc.string().filter((draftId) => draftId !== 'known-draft'),
        (actionName, unknownDraftId) => {
          const known = reviewItem('RED', 'known-draft')
          const unknown = reviewItem('RED', unknownDraftId)
          const initial: GameState = {
            ...createInitialGameState(),
            draftsQueue: [known],
          }

          const result = gameReducer(
            initial,
            workflowAction(actionName, unknown, 2),
          )

          expect(result).toBe(initial)
        },
      ),
    )
  })

  it('logs known workflow actions and ignores missing review targets', () => {
    fc.assert(
      fc.property(
        fc.array(workflowActionArbitrary, { minLength: 1, maxLength: 50 }),
        (actionNames) => {
          const red = reviewItem('RED')
          let state: GameState = {
            ...createInitialGameState(),
            draftsQueue: [red],
          }

          actionNames.forEach((name, index) => {
            const previousState = state
            const previousLength = state.decisionsLog.length
            const targetExists = state.draftsQueue.some(
              (draft) => draft.id === red.id,
            )
            state = gameReducer(state, workflowAction(name, red, index + 1))

            if (name !== 'GENERATE_DRAFTS' && !targetExists) {
              expect(state).toBe(previousState)
            } else {
              expect(state.decisionsLog).toHaveLength(previousLength + 1)
            }
          })
        },
      ),
    )
  })

  it('never publishes a RED draft before APPROVE_DRAFT', () => {
    const preApprovalActionArbitrary = fc.constantFrom<
      'GENERATE_DRAFTS' | 'EDIT_DRAFT' | 'REJECT_DRAFT'
    >('GENERATE_DRAFTS', 'EDIT_DRAFT', 'REJECT_DRAFT')

    fc.assert(
      fc.property(
        fc.array(preApprovalActionArbitrary, { maxLength: 40 }),
        (actionNames) => {
          const red = reviewItem('RED')
          let state = createInitialGameState()

          actionNames.forEach((name, index) => {
            state = gameReducer(state, workflowAction(name, red, index + 1))
            expect(state.pledges.some((pledge) => pledge.id === red.id)).toBe(false)
          })
        },
      ),
    )
  })
})


function verifierChecks(outcome: ProposedOutcome): VerifierCheck[] {
  return VERIFIER_NAMES.map((name, index) => ({
    name,
    outcome,
    confidence: 0.9 + index * 0.01,
    reasons: ['Les preuves fictives concordent.'],
  }))
}

function resolvableState(
  pools: Readonly<Record<Side, number>>,
  tier: 'GREEN' | 'ORANGE' = 'GREEN',
): GameState {
  const state = stateWithPledge(
    [
      {
        url: 'https://example.org/official-resolution',
        kind: 'official',
        independentGroup: 'official-resolution',
      },
    ],
    pools,
  )

  return {
    ...state,
    pledges: [{ ...state.pledges[0], tier }],
  }
}

function totalAfterResolution(state: GameState, pledgeId: string): number {
  const result = state.resolutions[pledgeId]
  const fictionalPayouts = result.payouts
    .filter((payout) => payout.fictional)
    .reduce((sum, payout) => sum + payout.payout, 0)
  return state.player.souls + fictionalPayouts + result.unpaidPool
}

describe('three-spirit resolution properties', () => {
  it('a HUMAN_OVERRIDE creates exactly one tombstone and one log entry', () => {
    fc.assert(
      fc.property(outcomeArbitrary, (aiOutcome) => {
        const initial = resolvableState({ KEPT: 720, BROKEN: 480 })
        const pledgeId = initial.pledges[0].id
        const autoResolved = gameReducer(initial, {
          type: 'RUN_VERIFIERS',
          pledgeId,
          checks: verifierChecks(aiOutcome),
          at: 10,
        })
        const tombstonesBefore = autoResolved.tombstones.length
        const logsBefore = autoResolved.decisionsLog.length
        const humanOutcome: FinalState =
          aiOutcome === 'KEPT' ? 'BROKEN' : 'KEPT'
        const overridden = gameReducer(autoResolved, {
          type: 'HUMAN_OVERRIDE',
          pledgeId,
          outcome: humanOutcome,
          reason: 'Le Gardien corrige le verdict avec une preuve fictive.',
          at: 20,
        })

        expect(overridden.tombstones).toHaveLength(tombstonesBefore + 1)
        expect(overridden.decisionsLog).toHaveLength(logsBefore + 1)
        const lastLog = overridden.decisionsLog[overridden.decisionsLog.length - 1]
        const lastTombstone = overridden.tombstones[overridden.tombstones.length - 1]
        expect(lastLog?.action).toBe('HUMAN_OVERRIDE')
        expect(lastTombstone).toMatchObject({
          pledgeId,
          aiClaim: aiOutcome,
          humanOutcome,
        })
      }),
    )
  })

  it('conserves Souls after automatic, human, and override paths', () => {
    const pathArbitrary = fc.constantFrom<'AUTO' | 'HUMAN' | 'OVERRIDE'>(
      'AUTO',
      'HUMAN',
      'OVERRIDE',
    )
    const finalOutcomeArbitrary = fc.constantFrom<FinalState>(
      'KEPT',
      'BROKEN',
      'INCONCLUSIVE',
    )

    fc.assert(
      fc.property(
        pathArbitrary,
        fc.integer({ min: 10, max: 1_000 }),
        fc.integer({ min: 1, max: 10_000 }),
        fc.integer({ min: 1, max: 10_000 }),
        sideArbitrary,
        outcomeArbitrary,
        finalOutcomeArbitrary,
        (path, amount, keptPool, brokenPool, side, aiOutcome, humanOutcome) => {
          const tier = path === 'HUMAN' ? 'ORANGE' : 'GREEN'
          const initial = resolvableState(
            { KEPT: keptPool, BROKEN: brokenPool },
            tier,
          )
          const pledgeId = initial.pledges[0].id
          let state = gameReducer(initial, {
            type: 'STAKE',
            pledgeId,
            side,
            amount,
            at: 1,
          })
          state = gameReducer(state, {
            type: 'RUN_VERIFIERS',
            pledgeId,
            checks: verifierChecks(aiOutcome),
            at: 2,
          })

          if (path === 'HUMAN') {
            state = gameReducer(state, {
              type: 'HUMAN_RESOLVE',
              pledgeId,
              outcome: humanOutcome,
              reason: 'Décision humaine de propriété.',
              at: 3,
            })
          } else if (path === 'OVERRIDE') {
            const corrected: FinalState =
              aiOutcome === 'KEPT' ? 'BROKEN' : 'KEPT'
            state = gameReducer(state, {
              type: 'HUMAN_OVERRIDE',
              pledgeId,
              outcome: corrected,
              reason: 'Correction humaine de propriété.',
              at: 3,
            })
          }

          const totalBefore = initial.player.souls + keptPool + brokenPool
          expect(totalAfterResolution(state, pledgeId)).toBe(totalBefore)
        },
      ),
    )
  })
})
