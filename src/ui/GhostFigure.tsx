import type { CSSProperties, ReactNode } from 'react'
import type { LifecycleState } from '../engine/lifecycle'
import { ghostVisual, type GhostIcon } from './ghostProps'
import './ghost.css'

type GhostFigureProps = {
  state: LifecycleState
  evidenceLevel: number
  compact?: boolean
}

type GhostStyle = CSSProperties & {
  '--ghost-opacity': number
}

function StateIcon({ icon }: { icon: GhostIcon }) {
  let shape: ReactNode

  switch (icon) {
    case 'mist':
      shape = <path d="M3 7h11M6 11h11M3 15h9" />
      break
    case 'apparition':
      shape = <path d="M5 17V9a5 5 0 0 1 10 0v8l-2-2-3 2-3-2-2 2Zm3-8h.01M12 9h.01" />
      break
    case 'flame':
      shape = <path d="M10 18c3 0 5-2 5-5 0-2-1-4-4-7 0 3-2 4-3 2-2 2-3 4-3 5 0 3 2 5 5 5Z" />
      break
    case 'check':
      shape = <path d="m4 10 4 4 8-9" />
      break
    case 'crack':
      shape = <path d="m11 2-4 7 4 2-3 7M3 18h14" />
      break
    case 'question':
      shape = <path d="M7 7a3 3 0 1 1 4 3c-1 .5-1 1-1 2M10 16h.01" />
      break
  }

  return (
    <svg
      className="ghost-figure__state-icon"
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
    >
      {shape}
    </svg>
  )
}

export function GhostFigure({
  state,
  evidenceLevel,
  compact = false,
}: GhostFigureProps) {
  const visual = ghostVisual(state, evidenceLevel)
  const style: GhostStyle = { '--ghost-opacity': visual.opacity }

  return (
    <figure
      className={`ghost-figure ghost-figure--${state.toLowerCase()}${compact ? ' ghost-figure--compact' : ''}`}
      aria-label={`Fantôme : ${visual.label}`}
      data-animation={visual.animation}
      style={style}
    >
      <div className="ghost-figure__motion" aria-hidden="true">
        <svg
          className="ghost-figure__svg"
          viewBox="0 0 160 180"
          focusable="false"
        >
          <path
            className="ghost-figure__body"
            d="M31 148V77C31 46 52 24 80 24s49 22 49 53v71l-16-13-17 17-16-17-16 17-17-17-16 13Z"
          />
          <circle className="ghost-figure__eye" cx="62" cy="78" r="7" />
          <circle className="ghost-figure__eye" cx="98" cy="78" r="7" />
          <path
            className="ghost-figure__mouth"
            d="M68 105c7 6 17 6 24 0"
          />
          <path
            className="ghost-figure__cheek"
            d="M43 101c6 3 10 3 15 0M102 101c5 3 9 3 15 0"
          />
        </svg>
      </div>
      <figcaption className="ghost-figure__caption">
        <StateIcon icon={visual.icon} />
        <span>{visual.label}</span>
      </figcaption>
    </figure>
  )
}
