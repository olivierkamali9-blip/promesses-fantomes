import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { totalStakedOnDay } from './engine/stake'
import { translate } from './i18n'
import { useGame } from './state/useGame'
import { usePreferences } from './state/usePreferences'
import { AppShell } from './ui/shell/AppShell'
import { selectBrokenPledges } from './ui/cemeteryProps'

const Feed = lazy(() =>
  import('./ui/Feed').then((module) => ({ default: module.Feed })),
)
const PledgePage = lazy(() =>
  import('./ui/PledgePage').then((module) => ({ default: module.PledgePage })),
)
const ApprovalQueue = lazy(() =>
  import('./ui/ApprovalQueue').then((module) => ({ default: module.ApprovalQueue })),
)
const Cemetery = lazy(() =>
  import('./ui/Cemetery').then((module) => ({ default: module.Cemetery })),
)
const MyStakes = lazy(() =>
  import('./ui/MyStakes').then((module) => ({ default: module.MyStakes })),
)
const Profile = lazy(() =>
  import('./ui/Profile').then((module) => ({ default: module.Profile })),
)
const Settings = lazy(() =>
  import('./ui/Settings').then((module) => ({ default: module.Settings })),
)

function pledgeIdFromHash(hash: string): string | null {
  const match = /^#\/promesse\/([^/]+)$/.exec(hash)
  if (!match) return null

  try {
    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}

function App() {
  const [hash, setHash] = useState(() => window.location.hash)
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const { preferences, updatePreferences } = usePreferences()
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
  } = useGame(preferences.dailyStakeCap)

  useEffect(() => {
    const updateHash = () => {
      setHash(window.location.hash)
      window.scrollTo({ top: 0 })
      window.requestAnimationFrame(() => document.getElementById('main-content')?.focus())
    }

    window.addEventListener('hashchange', updateHash)
    return () => window.removeEventListener('hashchange', updateHash)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    document.documentElement.lang = preferences.locale
    document.documentElement.dataset.reduceMotion = String(preferences.reduceMotion)
    document.documentElement.dataset.dataSaver = String(preferences.dataSaver)
  }, [preferences])

  const pledgeId = pledgeIdFromHash(hash)
  const pledge = pledgeId
    ? state.pledges.find((candidate) => candidate.id === pledgeId)
    : undefined
  const cemeteryCount = selectBrokenPledges(state.pledges).length
  const stakedToday = totalStakedOnDay(state.playerStakes, currentTime)

  function returnToFeed() {
    window.location.hash = '#/'
  }

  let page: ReactNode
  if (pledgeId) {
    page = pledge ? (
      <PledgePage
        pledge={pledge}
        player={state.player}
        result={state.resolutions[pledge.id]}
        onBack={returnToFeed}
        onStake={stake}
        stakedToday={stakedToday}
        dailyStakeCap={preferences.dailyStakeCap}
        locale={preferences.locale}
        isVerifying={verifyingPledgeIds.includes(pledge.id)}
        onRunVerifiers={runPledgeVerifiers}
        onHumanResolve={humanResolve}
        onHumanOverride={humanOverride}
      />
    ) : (
      <section className="route-error" role="alert">
        <h2>{translate(preferences.locale, 'route.notFound')}</h2>
        <button type="button" onClick={returnToFeed}>{translate(preferences.locale, 'route.back')}</button>
      </section>
    )
  } else if (hash === '#/gardien') {
    page = (
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
    )
  } else if (hash === '#/cimetiere') {
    page = <Cemetery pledges={state.pledges} tombstones={state.tombstones} />
  } else if (hash === '#/mises') {
    page = (
      <MyStakes
        stakes={state.playerStakes}
        pledges={state.pledges}
        resolutions={state.resolutions}
        locale={preferences.locale}
      />
    )
  } else if (hash === '#/profil') {
    page = (
      <Profile
        player={state.player}
        stakes={state.playerStakes}
        pledges={state.pledges}
        resolutions={state.resolutions}
        locale={preferences.locale}
      />
    )
  } else if (hash === '#/parametres') {
    page = (
      <Settings
        preferences={preferences}
        onChange={updatePreferences}
        onResetDemo={resetDemo}
      />
    )
  } else {
    page = (
      <Feed
        pledges={state.pledges}
        cemeteryCount={cemeteryCount}
        sourceMode={sourceMode}
        sourceRefreshAt={state.sourceRefreshAt ?? currentTime}
        isRefreshing={isGeneratingDrafts}
        sourceError={state.sourceError}
      />
    )
  }

  return (
    <AppShell
      hash={hash}
      souls={state.player.souls}
      guardianDraftCount={state.draftsQueue.length}
      locale={preferences.locale}
    >
      <Suspense fallback={(
        <div className="haunted-loading" role="status" aria-live="polite">
          <span aria-hidden="true">◌</span>
          <p>{translate(preferences.locale, 'shell.loading')}</p>
        </div>
      )}>
        {page}
      </Suspense>
    </AppShell>
  )
}

export default App
