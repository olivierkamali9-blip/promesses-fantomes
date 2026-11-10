import { describe, expect, it } from 'vitest'
import fc from 'fast-check'

describe('project scaffold', () => {
  it('runs property-based tests with fast-check', () => {
    fc.assert(
      fc.property(fc.integer(), (value) => {
        expect(value + 0).toBe(value)
      }),
    )
  })
})
