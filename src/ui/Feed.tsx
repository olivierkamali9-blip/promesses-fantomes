import { useMemo, useState, type KeyboardEvent } from 'react'
import type { DemoPledge } from '../data/demoPledges'
import { filterByCategory, type CategoryFilter } from '../engine/feed'
import { timeState, type LifecycleState } from '../engine/lifecycle'
import type { AdapterMode } from '../sources'
import { PledgeCard } from './PledgeCard'
import './feed.css'

type FeedTab = 'open' | 'resolved'

type FeedProps = {
  pledges: readonly DemoPledge[]
  cemeteryCount: number
  sourceMode: AdapterMode
  sourceRefreshAt: number
  isRefreshing: boolean
}

const FINAL_STATES: ReadonlySet<LifecycleState> = new Set([
  'KEPT',
  'BROKEN',
  'INCONCLUSIVE',
])

const CATEGORIES: readonly { value: CategoryFilter; label: string }[] = [
  { value: 'ALL', label: 'Tout' },
  { value: 'SPORT', label: 'Sport' },
  { value: 'POLITICS', label: 'Politique' },
  { value: 'CELEBRITIES', label: 'Célébrités' },
  { value: 'WORLD', label: 'Monde' },
]

function isResolved(pledge: DemoPledge): boolean {
  return FINAL_STATES.has(pledge.state)
}

function isPublished(pledge: DemoPledge): boolean {
  return pledge.state === 'APPARITION' || pledge.state === 'HAUNTING'
}

export function Feed({
  pledges,
  cemeteryCount,
  sourceMode,
  sourceRefreshAt,
  isRefreshing,
}: FeedProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>('open')
  const [category, setCategory] = useState<CategoryFilter>('ALL')
  const now = new Date()
  const feedPledges = useMemo(() =>
    sourceMode === 'live'
      ? pledges.filter((pledge) => pledge.liveSource)
      : pledges.filter((pledge) => !pledge.liveSource),
  [pledges, sourceMode])
  const visiblePledges = useMemo(() => {
    const tabPledges = feedPledges.filter((pledge) =>
      pledge.liveKind !== 'REPLAY' &&
      (activeTab === 'resolved'
        ? isResolved(pledge)
        : isPublished(pledge)),
    )

    return filterByCategory(tabPledges, category)
      .sort(
        (left, right) => {
          if (left.liveSource !== right.liveSource) return left.liveSource ? -1 : 1
          return new Date(left.deadline).getTime() - new Date(right.deadline).getTime()
        },
      )
  }, [activeTab, category, feedPledges])
  const replayPledges = useMemo(
    () => filterByCategory(
      feedPledges.filter((pledge) => pledge.liveKind === 'REPLAY'),
      category,
    )
      .sort((left, right) =>
        Date.parse(right.deadline) - Date.parse(left.deadline),
      )
      .slice(0, 3),
    [category, feedPledges],
  )

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const nextTab: FeedTab = activeTab === 'open' ? 'resolved' : 'open'
    setActiveTab(nextTab)
    document.getElementById(`${nextTab}-tab`)?.focus()
  }

  return (
    <section className="feed" aria-labelledby="feed-title">
      <div className="feed__heading">
        <div>
          <p className="feed__eyebrow">Le cortège du jour</p>
          <h2 id="feed-title">Promesses à suivre</h2>
        </div>
      </div>

      <p className="feed__source-status">
        Sources : {sourceMode === 'live' ? 'en direct · veille automatique (10 min)' : 'démo'} · dernière actualisation{' '}
        <time dateTime={new Date(sourceRefreshAt).toISOString()}>
          {new Intl.DateTimeFormat('fr', {
            hour: '2-digit',
            minute: '2-digit',
          }).format(sourceRefreshAt)}
        </time>
      </p>

      <p className="feed__order-note">
        Les plus proches de leur échéance passent devant.
      </p>
      <a className="feed__cemetery-count" href="#/cimetiere">
        {cemeteryCount} promesses au cimetière
      </a>

      <div className="feed__categories" aria-label="Filtrer par catégorie">
        {CATEGORIES.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={category === item.value}
            onClick={() => setCategory(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {replayPledges.length > 0 && (
        <section className="feed__replays" aria-labelledby="replay-title">
          <div>
            <p className="feed__eyebrow">Preuves concordantes</p>
            <h3 id="replay-title">Rediffusion réelle</h3>
          </div>
          <p>
            {replayPledges.length} vrai{replayPledges.length > 1 ? 's' : ''} résultat{replayPledges.length > 1 ? 's' : ''} de la saison 2025-26, confirmé{replayPledges.length > 1 ? 's' : ''} par deux sources.
          </p>
          <div className="feed__list">
            {replayPledges.map((pledge) => (
              <PledgeCard
                key={pledge.id}
                pledge={pledge}
                state={pledge.state}
                now={now}
                href={`#/promesse/${encodeURIComponent(pledge.id)}`}
              />
            ))}
          </div>
        </section>
      )}

      <div className="feed__tabs" role="tablist" aria-label="État des promesses">
        <button
          id="open-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === 'open'}
          aria-controls="pledge-list"
          tabIndex={activeTab === 'open' ? 0 : -1}
          onKeyDown={handleTabKey}
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
          tabIndex={activeTab === 'resolved' ? 0 : -1}
          onKeyDown={handleTabKey}
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
        {visiblePledges.length === 0 ? (
          <p className="feed__empty" role="status">
            {sourceMode === 'live' && isRefreshing
              ? 'Gemini et le Scout surveillent les sources réelles…'
              : sourceMode === 'live'
                ? 'Aucune nouvelle promesse réelle vérifiable pour ce filtre.'
                : 'Aucun fantôme dans cette catégorie.'}
          </p>
        ) : visiblePledges.map((pledge) => (
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
