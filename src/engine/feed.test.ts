import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import type { PledgeCategory } from '../data/demoPledges'
import { filterByCategory, type CategoryFilter } from './feed'

const categories: readonly PledgeCategory[] = [
  'SPORT',
  'POLITICS',
  'CELEBRITIES',
  'WORLD',
]

const categoryArbitrary = fc.constantFrom(...categories)

describe('filterByCategory properties', () => {
  it('keeps exactly the pledges in the selected category and preserves order', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ id: fc.string(), category: categoryArbitrary })),
        fc.constantFrom<CategoryFilter>('ALL', ...categories),
        (pledges, category) => {
          const filtered = filterByCategory(pledges, category)
          const expected = category === 'ALL'
            ? pledges
            : pledges.filter((pledge) => pledge.category === category)

          expect(filtered).toEqual(expected)
          expect(filtered.every((pledge) =>
            category === 'ALL' || pledge.category === category,
          )).toBe(true)
        },
      ),
    )
  })
})
