import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  applyEvent,
  timeState,
  type FinalState,
  type LifecycleEvent,
  type LifecycleState,
  type ResolutionOutcome,
} from './lifecycle'

const finalStateArbitrary: fc.Arbitrary<FinalState> = fc.constantFrom(
  'KEPT',
  'BROKEN',
  'INCONCLUSIVE',
)
const stateArbitrary: fc.Arbitrary<LifecycleState> = fc.constantFrom(
  'MURMUR',
  'APPARITION',
  'HAUNTING',
  'KEPT',
  'BROKEN',
  'INCONCLUSIVE',
)
const resolutionOutcomeArbitrary: fc.Arbitrary<ResolutionOutcome> =
  finalStateArbitrary
const eventArbitrary: fc.Arbitrary<LifecycleEvent> = fc.oneof(
  fc.constant({ type: 'APPROVE' as const }),
  fc.record({
    type: fc.constant('RESOLVE' as const),
    outcome: resolutionOutcomeArbitrary,
    evidenceLevel: fc.integer({ min: -2, max: 6 }),
  }),
  fc.record({
    type: fc.constant('OVERRIDE' as const),
    outcome: resolutionOutcomeArbitrary,
  }),
)
const timestampArbitrary = fc.integer({
  min: new Date('2000-01-01T00:00:00.000Z').getTime(),
  max: new Date('2100-01-01T00:00:00.000Z').getTime(),
})
const allStates = new Set<LifecycleState>([
  'MURMUR',
  'APPARITION',
  'HAUNTING',
  'KEPT',
  'BROKEN',
  'INCONCLUSIVE',
])

function isFinalState(state: LifecycleState): state is FinalState {
  return state === 'KEPT' || state === 'BROKEN' || state === 'INCONCLUSIVE'
}

function isAllowed(state: LifecycleState, event: LifecycleEvent): boolean {
  if (event.type === 'APPROVE') {
    return state === 'MURMUR'
  }

  if (event.type === 'RESOLVE') {
    return state === 'APPARITION' || state === 'HAUNTING'
  }

  return isFinalState(state)
}

function resultState(
  result: LifecycleState | { state: FinalState; tombstone: true },
): LifecycleState {
  return typeof result === 'string' ? result : result.state
}

describe('lifecycle examples', () => {
  it('approves a murmur and rejects approval from any other state', () => {
    expect(applyEvent('MURMUR', { type: 'APPROVE' })).toBe('APPARITION')
    expect(() => applyEvent('APPARITION', { type: 'APPROVE' })).toThrow()
  })

  it('resolves with enough evidence and becomes inconclusive below level 3', () => {
    expect(
      applyEvent('APPARITION', {
        type: 'RESOLVE',
        outcome: 'KEPT',
        evidenceLevel: 3,
      }),
    ).toBe('KEPT')
    expect(
      applyEvent('HAUNTING', {
        type: 'RESOLVE',
        outcome: 'BROKEN',
        evidenceLevel: 2,
      }),
    ).toBe('INCONCLUSIVE')
  })

  it('enters haunting within 24 hours and records final-state overrides', () => {
    const deadline = new Date('2030-01-02T12:00:00.000Z')

    expect(
      timeState('APPARITION', new Date('2030-01-01T12:00:00.000Z'), deadline),
    ).toBe('HAUNTING')
    expect(applyEvent('BROKEN', { type: 'OVERRIDE', outcome: 'KEPT' })).toEqual({
      state: 'KEPT',
      tombstone: true,
    })
  })
})

describe('lifecycle properties', () => {
  it('P5: keeps final states terminal except through a recorded override', () => {
    fc.assert(
      fc.property(
        finalStateArbitrary,
        eventArbitrary,
        (state, event) => {
          if (event.type === 'OVERRIDE') {
            expect(applyEvent(state, event)).toEqual({
              state: event.outcome,
              tombstone: true,
            })
          } else {
            expect(() => applyEvent(state, event)).toThrow()
          }
        },
      ),
    )
  })

  it('never reaches an illegal state through a random event sequence', () => {
    fc.assert(
      fc.property(
        stateArbitrary,
        fc.array(eventArbitrary, { maxLength: 100 }),
        (initialState, events) => {
          let state = initialState

          for (const event of events) {
            if (!isAllowed(state, event)) {
              expect(() => applyEvent(state, event)).toThrow()
              continue
            }

            const nextState = resultState(applyEvent(state, event))
            expect(allStates.has(nextState)).toBe(true)
            state = nextState
          }
        },
      ),
    )
  })

  it('never reaches kept or broken below evidence level 3', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<LifecycleState>('APPARITION', 'HAUNTING'),
        fc.constantFrom<'KEPT' | 'BROKEN'>('KEPT', 'BROKEN'),
        fc.integer({ max: 2 }),
        (state, outcome, evidenceLevel) => {
          expect(
            applyEvent(state, { type: 'RESOLVE', outcome, evidenceLevel }),
          ).toBe('INCONCLUSIVE')
        },
      ),
    )
  })

  it('never changes a final state or murmur based on time', () => {
    fc.assert(
      fc.property(
        fc.oneof(finalStateArbitrary, fc.constant('MURMUR' as const)),
        timestampArbitrary,
        timestampArbitrary,
        (state, now, deadline) => {
          expect(timeState(state, new Date(now), new Date(deadline))).toBe(state)
        },
      ),
    )
  })
})
