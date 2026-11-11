import { useEffect, useState } from 'react'
import { useGame } from './state/useGame'
import { Feed } from './ui/Feed'
import { GhostGallery } from './ui/GhostGallery'
import { PledgePage } from './ui/PledgePage'

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
  const { state, stake, simulateResolution, resetDemo } = useGame()

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
        {!pledgeId && (
          <button
            className="app-view-link"
            type="button"
            aria-expanded={showGallery}
            onClick={() => setShowGallery((visible) => !visible)}
          >
            {showGallery ? 'Retour au fil' : 'Galerie des états'}
          </button>
        )}
      </header>

      {pledgeId ? (
        pledge ? (
          <PledgePage
            pledge={pledge}
            player={state.player}
            result={state.resolutions[pledge.id]}
            onBack={returnToFeed}
            onStake={stake}
            onSimulate={simulateResolution}
          />
        ) : (
          <section className="route-error" role="alert">
            <h2>Cette promesse reste introuvable.</h2>
            <button type="button" onClick={returnToFeed}>Retour</button>
          </section>
        )
      ) : showGallery ? (
        <GhostGallery />
      ) : (
        <Feed
          pledges={state.pledges}
          playerSouls={state.player.souls}
          onResetDemo={resetDemo}
        />
      )}
    </main>
  )
}

export default App
