import { useState } from 'react'
import type { LifecycleState } from '../engine/lifecycle'
import { GhostFigure } from './GhostFigure'

const STATES: readonly LifecycleState[] = [
  'MURMUR',
  'APPARITION',
  'HAUNTING',
  'KEPT',
  'BROKEN',
  'INCONCLUSIVE',
]

export function GhostGallery() {
  const [evidenceLevel, setEvidenceLevel] = useState(2)

  return (
    <section className="ghost-gallery" aria-labelledby="ghost-gallery-title">
      <div className="ghost-gallery__heading">
        <div>
          <h2 id="ghost-gallery-title">Les états du fantôme</h2>
          <p>Chaque mouvement raconte où en est la promesse.</p>
        </div>

        <label className="ghost-gallery__control">
          <span>
            Niveau de preuve
            <output htmlFor="evidence-level">L{evidenceLevel}</output>
          </span>
          <input
            id="evidence-level"
            type="range"
            min="0"
            max="4"
            step="1"
            value={evidenceLevel}
            onChange={(event) => setEvidenceLevel(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="ghost-gallery__grid">
        {STATES.map((state) => (
          <GhostFigure
            key={state}
            state={state}
            evidenceLevel={evidenceLevel}
          />
        ))}
      </div>
    </section>
  )
}
