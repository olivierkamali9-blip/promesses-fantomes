import type { PledgeCategory } from '../data/demoPledges'

export type CategoryFilter = 'ALL' | PledgeCategory

export function filterByCategory<T extends { category: PledgeCategory }>(
  pledges: readonly T[],
  category: CategoryFilter,
): T[] {
  return category === 'ALL'
    ? [...pledges]
    : pledges.filter((pledge) => pledge.category === category)
}
