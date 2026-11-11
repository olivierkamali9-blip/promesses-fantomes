import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import type { LifecycleState } from '../engine/lifecycle'
import { ghostVisual } from './ghostProps'

const STATES: readonly LifecycleState[] = [
  'MURMUR',
  'APPARITION',
  'HAUNTING',
  'KEPT',
  'BROKEN',
  'INCONCLUSIVE',
]

const stateArbitrary: fc.Arbitrary<LifecycleState> = fc.constantFrom(...STATES)

describe('ghostVisual properties', () => {
  it('never decreases opacity when the evidence level rises', () => {
    fc.assert(
      fc.property(
        stateArbitrary,
        fc.integer(),
        fc.integer(),
        (state, firstLevel, secondLevel) => {
          const lowerLevel = Math.min(firstLevel, secondLevel)
          const higherLevel = Math.max(firstLevel, secondLevel)

          expect(ghostVisual(state, higherLevel).opacity).toBeGreaterThanOrEqual(
            ghostVisual(state, lowerLevel).opacity,
          )
        },
      ),
    )
  })

  it('gives every state a non-empty label and icon', () => {
    fc.assert(
      fc.property(stateArbitrary, fc.integer(), (state, level) => {
        const visual = ghostVisual(state, level)

        expect(visual.label.trim()).not.toBe('')
        expect(visual.icon.trim()).not.toBe('')
      }),
    )
  })

  it('clamps evidence levels outside the 0 to 4 range', () => {
    fc.assert(
      fc.property(
        stateArbitrary,
        fc.integer({ max: -1 }),
        fc.integer({ min: 5 }),
        (state, belowRange, aboveRange) => {
          expect(ghostVisual(state, belowRange).opacity).toBe(
            ghostVisual(state, 0).opacity,
          )
          expect(ghostVisual(state, aboveRange).opacity).toBe(
            ghostVisual(state, 4).opacity,
          )
        },
      ),
    )
  })
})
