import type { CSSProperties } from 'react'
import type { DemoPledge } from '../data/demoPledges'
import type { LifecycleState } from '../engine/lifecycle'
import { poolPercentages } from '../engine/souls'
import { GhostFigure } from './GhostFigure'
import { formatCountdown } from './pledgeCardProps'

const EVIDENCE_LEVELS = [0, 1, 2, 3, 4] as const

const TIER_LABELS: Record<DemoPledge['tier'], string> = {
  GREEN: 'Vert',
  ORANGE: 'Orange',
  RED: 'Rouge',
}

type PledgeCardProps = {
  pledge: DemoPledge
  state: LifecycleState
  now: Date
  href: string
}

type SplitStyle = CSSProperties & {
  '--kept-share': `${number}%`
}

export function PledgeCard({ pledge, state, now, href }: PledgeCardProps) {
  const percentages = poolPercentages(pledge.stakes)
  const splitStyle: SplitStyle = {
    '--kept-share': `${percentages.KEPT}%`,
  }
  const titleId = `pledge-${pledge.id}`
  const countdown = formatCountdown(new Date(pledge.deadline), now)

  return (
    <a className="pledge-card-link" href={href} aria-labelledby={titleId}>
      <article className="pledge-card">
        <div className="pledge-card__badges">
          <span className="pledge-card__fictional">Scénario fictif</span>
          <span
            className={`pledge-card__tier pledge-card__tier--${pledge.tier.toLowerCase()}`}
          >
            Risque : {TIER_LABELS[pledge.tier]}
          </span>
          {pledge.unconfirmed && (
            <span className="pledge-card__unconfirmed">Non confirmé</span>
          )}
        </div>

        <div className="pledge-card__summary">
          <GhostFigure
            state={state}
            evidenceLevel={pledge.evidenceLevel}
            compact
          />
          <div>
            <h3 id={titleId}>{pledge.question}</h3>
            <time className="pledge-card__countdown" dateTime={pledge.deadline}>
              {countdown === 'Échéance atteinte'
                ? countdown
                : `Échéance dans ${countdown}`}
            </time>
          </div>
        </div>

        <div className="pledge-card__stakes">
          <div className="pledge-card__stake-labels">
            <span>
              TENUE <strong>{percentages.KEPT}%</strong>
            </span>
            <span>
              ROMPUE <strong>{percentages.BROKEN}%</strong>
            </span>
          </div>
          <div
            className="pledge-card__split"
            role="img"
            aria-label={`Mises : ${percentages.KEPT} % tenue, ${percentages.BROKEN} % rompue`}
            style={splitStyle}
          >
            <span className="pledge-card__split-kept" />
            <span className="pledge-card__split-broken" />
          </div>
        </div>

        <div
          className="pledge-card__evidence"
          aria-label={`Niveau de preuve actuel : L${pledge.evidenceLevel}`}
        >
          <span className="pledge-card__evidence-label">Preuves</span>
          <ol>
            {EVIDENCE_LEVELS.map((level) => (
              <li
                key={level}
                className={
                  level === pledge.evidenceLevel
                    ? 'pledge-card__evidence-current'
                    : undefined
                }
                aria-current={level === pledge.evidenceLevel ? 'step' : undefined}
              >
                L{level}
              </li>
            ))}
          </ol>
        </div>
      </article>
    </a>
  )
}
