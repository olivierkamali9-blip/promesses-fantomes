import type { CSSProperties } from 'react'
import type { LifecycleState } from '../engine/lifecycle'
import { ghostVisual } from './ghostProps'
import './ghost.css'

type GhostFigureProps = {
  state: LifecycleState
  evidenceLevel: number
}

type GhostStyle = CSSProperties & {
  '--ghost-opacity': number
}

export function GhostFigure({ state, evidenceLevel }: GhostFigureProps) {
  const visual = ghostVisual(state, evidenceLevel)
  const style: GhostStyle = { '--ghost-opacity': visual.opacity }

  return (
    <figure
      className={`ghost-figure ghost-figure--${state.toLowerCase()}`}
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
        <span aria-hidden="true">{visual.icon}</span>
        <span>{visual.label}</span>
      </figcaption>
    </figure>
  )
}
