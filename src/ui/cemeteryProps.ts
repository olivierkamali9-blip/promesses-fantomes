import type { DemoPledge } from '../data/demoPledges'
import type { LifecycleState } from '../engine/lifecycle'

export type CemeteryPledge = Pick<DemoPledge, 'state'> & {
  evidenceLevel: number
}

export function buildEpitaph(pledge: CemeteryPledge): string {
  const level = Math.min(4, Math.max(0, Math.trunc(pledge.evidenceLevel)))

  if (pledge.state === 'BROKEN') {
    return `Promesse non tenue. Preuves : L${level}.`
  }

  if (pledge.state === 'INCONCLUSIVE') {
    return `Sans verdict. Preuves insuffisantes : L${level}.`
  }

  return `Cette promesse poursuit son chemin. Preuves : L${level}.`
}

export function selectBrokenPledges<T extends { state: LifecycleState }>(
  pledges: readonly T[],
): T[] {
  return pledges.filter((pledge) => pledge.state === 'BROKEN')
}

export function selectInconclusivePledges<
  T extends { state: LifecycleState },
>(pledges: readonly T[]): T[] {
  return pledges.filter((pledge) => pledge.state === 'INCONCLUSIVE')
}
