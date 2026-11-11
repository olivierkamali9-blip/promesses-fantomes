import type { LifecycleState } from '../engine/lifecycle'

export type GhostAnimation =
  | 'flicker'
  | 'float'
  | 'float-fast'
  | 'solid'
  | 'sink'
  | 'fade'

export type GhostVisual = {
  opacity: number
  animation: GhostAnimation
  label: string
  icon: string
}

const OPACITY_BY_LEVEL = [0.25, 0.4, 0.6, 0.8, 1] as const

const VISUAL_BY_STATE: Record<
  LifecycleState,
  Omit<GhostVisual, 'opacity'>
> = {
  MURMUR: { animation: 'flicker', label: 'Murmure', icon: '🌫️' },
  APPARITION: { animation: 'float', label: 'Apparition', icon: '👻' },
  HAUNTING: { animation: 'float-fast', label: 'Hantise', icon: '🕯️' },
  KEPT: { animation: 'solid', label: 'Promesse tenue', icon: '✨' },
  BROKEN: { animation: 'sink', label: 'Promesse rompue', icon: '🪦' },
  INCONCLUSIVE: { animation: 'fade', label: 'Sans verdict', icon: '❔' },
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
