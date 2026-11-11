import { GhostGallery } from './ui/GhostGallery'

function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="app-header__eyebrow">L’Oracle veille</p>
        <h1>Promesses Fantômes</h1>
        <p>
          Les promesses publiques restent visibles jusqu’à l’arrivée des
          preuves.
        </p>
      </header>
      <GhostGallery />
    </main>
  )
}

export default App
