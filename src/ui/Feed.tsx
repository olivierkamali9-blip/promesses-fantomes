import { useMemo, useState } from 'react'
import type { DemoPledge } from '../data/demoPledges'
import { timeState, type LifecycleState } from '../engine/lifecycle'
import { PledgeCard } from './PledgeCard'
import './feed.css'

type FeedTab = 'open' | 'resolved'

type FeedProps = {
  pledges: readonly DemoPledge[]
  playerSouls: number
  onResetDemo: () => void
}

const FINAL_STATES: ReadonlySet<LifecycleState> = new Set([
  'KEPT',
  'BROKEN',
  'INCONCLUSIVE',
])

function isResolved(pledge: DemoPledge): boolean {
  return FINAL_STATES.has(pledge.state)
}

export function Feed({ pledges, playerSouls, onResetDemo }: FeedProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>('open')
  const now = new Date()
  const visiblePledges = useMemo(
    () =>
      pledges
        .filter((pledge) =>
          activeTab === 'resolved' ? isResolved(pledge) : !isResolved(pledge),
        )
        .slice()
        .sort(
          (left, right) =>
            new Date(left.deadline).getTime() -
            new Date(right.deadline).getTime(),
        ),
    [activeTab, pledges],
  )

  return (
    <section className="feed" aria-labelledby="feed-title">
      <div className="feed__heading">
        <div>
          <p className="feed__eyebrow">Le cortège du jour</p>
          <h2 id="feed-title">Promesses à suivre</h2>
        </div>
        <div className="feed__player">
          <p>Vos Âmes <strong>{playerSouls}</strong></p>
          <button type="button" onClick={onResetDemo}>Réinitialiser la démo</button>
        </div>
      </div>

      <p className="feed__order-note">
        Les plus proches de leur échéance passent devant.
      </p>

      <div className="feed__tabs" role="tablist" aria-label="Filtrer les promesses">
        <button
          id="open-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === 'open'}
          aria-controls="pledge-list"
          onClick={() => setActiveTab('open')}
        >
          Ouvertes
        </button>
        <button
          id="resolved-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === 'resolved'}
          aria-controls="pledge-list"
          onClick={() => setActiveTab('resolved')}
        >
          Résolues
        </button>
      </div>

      <div
        id="pledge-list"
        className="feed__list"
        role="tabpanel"
        aria-labelledby={activeTab === 'open' ? 'open-tab' : 'resolved-tab'}
      >
        {visiblePledges.map((pledge) => (
          <PledgeCard
            key={pledge.id}
            pledge={pledge}
            state={timeState(pledge.state, now, new Date(pledge.deadline))}
            now={now}
            href={`#/promesse/${encodeURIComponent(pledge.id)}`}
          />
        ))}
      </div>
    </section>
  )
}
