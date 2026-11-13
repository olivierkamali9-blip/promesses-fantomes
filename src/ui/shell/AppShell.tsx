import type { ReactNode } from 'react'
import { translate, type Locale, type TranslationKey } from '../../i18n'
import './appShell.css'

type AppShellProps = {
  children: ReactNode
  hash: string
  souls: number
  guardianDraftCount: number
  locale: Locale
}

type IconName = 'feed' | 'stakes' | 'guardian' | 'cemetery' | 'profile'

const tabs: readonly { href: string; key: TranslationKey; icon: IconName }[] = [
  { href: '#/', key: 'shell.feed', icon: 'feed' },
  { href: '#/mises', key: 'shell.stakes', icon: 'stakes' },
  { href: '#/gardien', key: 'shell.guardian', icon: 'guardian' },
  { href: '#/cimetiere', key: 'shell.cemetery', icon: 'cemetery' },
  { href: '#/profil', key: 'shell.profile', icon: 'profile' },
]

function GhostLogo() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M7 27V14a9 9 0 0 1 18 0v13l-4-3-5 4-5-4-4 3Z" />
      <circle cx="13" cy="14" r="1.5" /><circle cx="20" cy="14" r="1.5" />
    </svg>
  )
}

function TabIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    feed: <><path d="M4 6h16M6 11h12M8 16h8" /><path d="M5 20c2-3 4-3 6 0 2-3 4-3 6 0" /></>,
    stakes: <><path d="M5 18V9a7 7 0 0 1 14 0v9l-3-2-4 3-4-3-3 2Z" /><path d="M9 10h.01M15 10h.01M9 13h6" /></>,
    guardian: <><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-5" /></>,
    cemetery: <><path d="M7 21h10M9 21V7a3 3 0 0 1 6 0v14M8 11h8" /><path d="M11 7h2" /></>,
    profile: <><path d="M5 21v-4a7 7 0 0 1 14 0v4" /><circle cx="12" cy="8" r="4" /><path d="M4 21h16" /></>,
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paths[name]}</svg>
}

function isTabActive(hash: string, href: string): boolean {
  if (href === '#/') return hash === '' || hash === '#/' || hash.startsWith('#/promesse/')
  return hash === href || (href === '#/profil' && hash === '#/parametres')
}

export function AppShell({
  children,
  hash,
  souls,
  guardianDraftCount,
  locale,
}: AppShellProps) {
  const t = (key: TranslationKey) => translate(locale, key)

  return (
    <div className="mobile-shell">
      <header className="mobile-shell__topbar">
        <a className="mobile-shell__brand" href="#/" aria-label={t('shell.brand')}>
          <GhostLogo />
          <span>{t('shell.brand')}</span>
        </a>
        <div className="mobile-shell__top-actions">
          <a className="mobile-shell__souls" href="#/profil">
            <span>{t('shell.souls')}</span><strong>{souls}</strong>
          </a>
          <a className="mobile-shell__bell" href="#/gardien" aria-label={`${t('shell.guardianDrafts')}: ${guardianDraftCount}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M6 17h12l-2-3V9a4 4 0 0 0-8 0v5l-2 3Zm4 3h4" />
            </svg>
            <span aria-hidden="true">{guardianDraftCount}</span>
          </a>
        </div>
      </header>

      <main id="main-content" className="mobile-shell__content" tabIndex={-1}>{children}</main>

      <nav className="mobile-shell__tabs" aria-label={t('shell.mainNavigation')}>
        {tabs.map((tab) => {
          const active = isTabActive(hash, tab.href)
          return (
            <a key={tab.href} href={tab.href} aria-current={active ? 'page' : undefined}>
              <TabIcon name={tab.icon} />
              <span>{t(tab.key)}</span>
            </a>
          )
        })}
      </nav>
    </div>
  )
}
