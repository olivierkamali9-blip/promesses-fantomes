import type { LifecycleState } from '../engine/lifecycle'

export type GhostAnimation =
  | 'flicker'
  | 'float'
  | 'float-fast'
  | 'solid'
  | 'sink'
  | 'fade'

export type GhostIcon =
  | 'mist'
  | 'apparition'
  | 'flame'
  | 'check'
  | 'crack'
  | 'question'

export type GhostVisual = {
  opacity: number
  animation: GhostAnimation
  label: string
  icon: GhostIcon
}

const OPACITY_BY_LEVEL = [0.25, 0.4, 0.6, 0.8, 1] as const

const VISUAL_BY_STATE: Record<
  LifecycleState,
  Omit<GhostVisual, 'opacity'>
> = {
  MURMUR: { animation: 'flicker', label: 'Murmure', icon: 'mist' },
  APPARITION: {
    animation: 'float',
    label: 'Apparition',
    icon: 'apparition',
  },
  HAUNTING: { animation: 'float-fast', label: 'Hantise', icon: 'flame' },
  KEPT: { animation: 'solid', label: 'Promesse tenue', icon: 'check' },
  BROKEN: { animation: 'sink', label: 'Promesse rompue', icon: 'crack' },
  INCONCLUSIVE: {
    animation: 'fade',
    label: 'Sans verdict',
    icon: 'question',
  },
}

function clampEvidenceLevel(level: number): number {
  if (Number.isNaN(level)) {
    return 0
  }

  return Math.min(4, Math.max(0, Math.trunc(level)))
}

export function ghostVisual(
  state: LifecycleState,
  evidenceLevel: number,
): GhostVisual {
  return {
    ...VISUAL_BY_STATE[state],
    opacity: OPACITY_BY_LEVEL[clampEvidenceLevel(evidenceLevel)],
  }
}
