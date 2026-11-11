import { useState } from 'react'
import { Feed } from './ui/Feed'
import { GhostGallery } from './ui/GhostGallery'

function App() {
  const [showGallery, setShowGallery] = useState(false)

  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="app-header__eyebrow">L’Oracle veille</p>
        <h1>Promesses Fantômes</h1>
        <p>
          Les promesses publiques restent visibles jusqu’à l’arrivée des
          preuves.
        </p>
        <button
          className="app-view-link"
          type="button"
          aria-expanded={showGallery}
          onClick={() => setShowGallery((visible) => !visible)}
        >
          {showGallery ? 'Retour au fil' : 'Galerie des états'}
        </button>
      </header>

      {showGallery ? <GhostGallery /> : <Feed />}
    </main>
  )
}

export default App
