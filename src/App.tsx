import { lazy, Suspense, useEffect, useState } from 'react'
import { useGame } from './state/useGame'
import { Feed } from './ui/Feed'
import { PledgePage } from './ui/PledgePage'
import { selectBrokenPledges } from './ui/cemeteryProps'

const ApprovalQueue = lazy(() =>
  import('./ui/ApprovalQueue').then((module) => ({
    default: module.ApprovalQueue,
  })),
)
const Cemetery = lazy(() =>
  import('./ui/Cemetery').then((module) => ({ default: module.Cemetery })),
)
const GhostGallery = lazy(() =>
  import('./ui/GhostGallery').then((module) => ({
    default: module.GhostGallery,
  })),
)

function pledgeIdFromHash(hash: string): string | null {
  const match = /^#\/promesse\/([^/]+)$/.exec(hash)

  if (!match) {
    return null
  }

  try {
    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}

function App() {
  const [showGallery, setShowGallery] = useState(false)
  const [hash, setHash] = useState(() => window.location.hash)
  const {
    state,
    sourceMode,
    isGeneratingDrafts,
    verifyingPledgeIds,
    stake,
    runPledgeVerifiers,
    humanResolve,
    humanOverride,
    generateDrafts,
    approveDraft,
    editDraft,
    rejectDraft,
    resetDemo,
  } = useGame()

  useEffect(() => {
    const updateHash = () => {
      setHash(window.location.hash)
      setShowGallery(false)
      window.scrollTo({ top: 0 })
    }

    window.addEventListener('hashchange', updateHash)
    return () => window.removeEventListener('hashchange', updateHash)
  }, [])

  const pledgeId = pledgeIdFromHash(hash)
  const isGuardian = hash === '#/gardien'
  const isCemetery = hash === '#/cimetiere'
  const isSecondaryRoute = isGuardian || isCemetery
  const cemeteryCount = selectBrokenPledges(state.pledges).length
  const pledge = pledgeId
    ? state.pledges.find((candidate) => candidate.id === pledgeId)
    : undefined

  function returnToFeed() {
    window.location.hash = '#/'
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="app-header__eyebrow">L’Oracle veille</p>
        <h1>Promesses Fantômes</h1>
        <p>
          Les promesses publiques restent visibles jusqu’à l’arrivée des
          preuves.
        </p>
        <nav className="app-header__actions" aria-label="Navigation principale">
          <a
            className="app-view-link app-guardian-link"
            href="#/gardien"
            aria-current={isGuardian ? 'page' : undefined}
          >
            Gardien
            <span
              className="app-guardian-link__badge"
              aria-label={`${state.draftsQueue.length} brouillon(s) en attente`}
            >
              {state.draftsQueue.length}
            </span>
          </a>
          <a
            className="app-view-link"
            href="#/cimetiere"
            aria-current={isCemetery ? 'page' : undefined}
          >
            Cimetière
          </a>
          {isSecondaryRoute && (
            <a className="app-view-link" href="#/">
              Retour au fil
            </a>
          )}
          {!pledgeId && !isSecondaryRoute && (
            <button
              className="app-view-link"
              type="button"
              aria-expanded={showGallery}
              onClick={() => setShowGallery((visible) => !visible)}
            >
              {showGallery ? 'Retour au fil' : 'Galerie des états'}
            </button>
          )}
        </nav>
      </header>

      <Suspense
        fallback={(
          <div className="haunted-loading" role="status" aria-live="polite">
            <span aria-hidden="true">◌</span>
            <p>Les esprits ouvrent les archives…</p>
          </div>
        )}
      >
        {pledgeId ? (
          pledge ? (
            <PledgePage
              pledge={pledge}
              player={state.player}
              result={state.resolutions[pledge.id]}
              onBack={returnToFeed}
              onStake={stake}
              isVerifying={verifyingPledgeIds.includes(pledge.id)}
              onRunVerifiers={runPledgeVerifiers}
              onHumanResolve={humanResolve}
              onHumanOverride={humanOverride}
            />
          ) : (
            <section className="route-error" role="alert">
              <h2>Cette promesse reste introuvable.</h2>
              <button type="button" onClick={returnToFeed}>Retour</button>
            </section>
          )
        ) : isGuardian ? (
          <ApprovalQueue
            drafts={state.draftsQueue}
            decisions={state.decisionsLog}
            sourceMode={sourceMode}
            isGenerating={isGeneratingDrafts}
            onGenerate={generateDrafts}
            onApprove={approveDraft}
            onEdit={editDraft}
            onReject={rejectDraft}
          />
        ) : isCemetery ? (
          <Cemetery
            pledges={state.pledges}
            tombstones={state.tombstones}
          />
        ) : showGallery ? (
          <GhostGallery />
        ) : (
          <Feed
            pledges={state.pledges}
            playerSouls={state.player.souls}
            cemeteryCount={cemeteryCount}
            onResetDemo={resetDemo}
          />
        )}
      </Suspense>
    </main>
  )
}

export default App
