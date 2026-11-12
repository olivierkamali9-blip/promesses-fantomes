import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import type { DemoPledge } from '../data/demoPledges'
import type { FinalState } from '../engine/lifecycle'
import type { Tombstone } from '../state/useGame'
import { GhostFigure } from './GhostFigure'
import {
  buildEpitaph,
  selectBrokenPledges,
  selectInconclusivePledges,
} from './cemeteryProps'
import './cemetery.css'

type CemeteryTab = 'broken' | 'ai-errors'

type CemeteryProps = {
  pledges: readonly DemoPledge[]
  tombstones: readonly Tombstone[]
}

const EVIDENCE_LEVELS = [0, 1, 2, 3, 4] as const

const VERDICT_LABELS: Record<FinalState, string> = {
  KEPT: 'Promesse tenue',
  BROKEN: 'Promesse rompue',
  INCONCLUSIVE: 'Sans verdict',
}

function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Date inconnue'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function validDateTime(value: string): string | undefined {
  return Number.isNaN(new Date(value).getTime()) ? undefined : value
}

function resolutionDate(pledge: DemoPledge): string {
  return pledge.verification
    ? new Date(pledge.verification.checkedAt).toISOString()
    : pledge.deadline
}

function StoneMarker({ label }: { label: string }) {
  return (
    <figure className="stone-marker" aria-label={`Pierre tombale : ${label}`}>
      <svg
        className="stone-marker__svg"
        viewBox="0 0 180 150"
        role="img"
        aria-label={`Pierre tombale marquée ${label}`}
      >
        <path
          className="stone-marker__stone"
          d="M38 130V65c0-31 23-50 52-50s52 19 52 50v65H38Z"
        />
        <path className="stone-marker__edge" d="M25 130h130M49 65c0-23 17-38 41-38" />
        <path className="stone-marker__mist stone-marker__mist--back" d="M8 116c24-13 47 11 70-2s43 7 68-5 25 5 32 8" />
        <path className="stone-marker__mist stone-marker__mist--front" d="M2 137c28-12 52 8 78-4s50 8 98-2" />
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  )
}

function EvidenceChips({ level }: { level: number }) {
  return (
    <div
      className="cemetery-card__evidence"
      aria-label={`Niveau de preuve L${level} sur L4`}
    >
      <span>Preuves</span>
      <ol>
        {EVIDENCE_LEVELS.map((candidate) => (
          <li
            key={candidate}
            className={candidate === level ? 'is-current' : undefined}
            aria-current={candidate === level ? 'true' : undefined}
          >
            L{candidate}
          </li>
        ))}
      </ol>
    </div>
  )
}

function PledgeTombstone({
  pledge,
  quiet = false,
}: {
  pledge: DemoPledge
  quiet?: boolean
}) {
  const date = resolutionDate(pledge)
  const label = quiet ? 'Sans verdict' : 'Promesse rompue'

  return (
    <article className={`cemetery-card${quiet ? ' cemetery-card--quiet' : ''}`}>
      <StoneMarker label={label} />
      <div className="cemetery-card__ghost">
        <GhostFigure
          state={pledge.state}
          evidenceLevel={pledge.evidenceLevel}
          compact
        />
      </div>
      <h4>
        <a href={`#/promesse/${encodeURIComponent(pledge.id)}`}>
          {pledge.question}
        </a>
      </h4>
      <p className="cemetery-card__date">
        Date de résolution :{' '}
        <time dateTime={validDateTime(date)}>{formatDate(date)}</time>
      </p>
      <EvidenceChips level={pledge.evidenceLevel} />
      <p className="cemetery-card__epitaph">{buildEpitaph(pledge)}</p>
    </article>
  )
}

function HauntedEmptyState({ children }: { children: string }) {
  return (
    <div className="cemetery__empty" role="status">
      <span aria-hidden="true">◌</span>
      <p>{children}</p>
    </div>
  )
}

export function Cemetery({ pledges, tombstones }: CemeteryProps) {
  const [activeTab, setActiveTab] = useState<CemeteryTab>('broken')
  const brokenTabRef = useRef<HTMLButtonElement>(null)
  const errorsTabRef = useRef<HTMLButtonElement>(null)
  const brokenPledges = useMemo(() => selectBrokenPledges(pledges), [pledges])
  const inconclusivePledges = useMemo(
    () => selectInconclusivePledges(pledges),
    [pledges],
  )
  const pledgesById = useMemo(
    () => new Map(pledges.map((pledge) => [pledge.id, pledge])),
    [pledges],
  )

  function selectTab(tab: CemeteryTab) {
    setActiveTab(tab)
    const target = tab === 'broken' ? brokenTabRef : errorsTabRef
    target.current?.focus()
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowLeft' || event.key === 'Home') {
      event.preventDefault()
      selectTab('broken')
    } else if (event.key === 'ArrowRight' || event.key === 'End') {
      event.preventDefault()
      selectTab('ai-errors')
    }
  }

  return (
    <section className="cemetery" aria-labelledby="cemetery-title">
      <div className="cemetery__heading">
        <p className="cemetery__eyebrow">Les archives de l’Oracle</p>
        <h2 id="cemetery-title">Cimetière</h2>
        <p>Les verdicts restent gravés, preuves et corrections comprises.</p>
      </div>

      <div className="cemetery__tabs" role="tablist" aria-label="Sections du cimetière">
        <button
          id="broken-pledges-tab"
          ref={brokenTabRef}
          type="button"
          role="tab"
          tabIndex={activeTab === 'broken' ? 0 : -1}
          aria-selected={activeTab === 'broken'}
          aria-controls="broken-pledges-panel"
          onClick={() => setActiveTab('broken')}
          onKeyDown={handleTabKeyDown}
        >
          Promesses rompues
        </button>
        <button
          id="ai-errors-tab"
          ref={errorsTabRef}
          type="button"
          role="tab"
          tabIndex={activeTab === 'ai-errors' ? 0 : -1}
          aria-selected={activeTab === 'ai-errors'}
          aria-controls="ai-errors-panel"
          onClick={() => setActiveTab('ai-errors')}
          onKeyDown={handleTabKeyDown}
        >
          Erreurs de l’IA
        </button>
      </div>

      {activeTab === 'broken' ? (
        <div
          id="broken-pledges-panel"
          role="tabpanel"
          aria-labelledby="broken-pledges-tab"
          tabIndex={0}
        >
          {brokenPledges.length === 0 ? (
            <HauntedEmptyState>
              Aucune promesse rompue ne trouble encore ces allées.
            </HauntedEmptyState>
          ) : (
            <div className="cemetery__grid">
              {brokenPledges.map((pledge) => (
                <PledgeTombstone key={pledge.id} pledge={pledge} />
              ))}
            </div>
          )}

          <section className="cemetery__inconclusive" aria-labelledby="inconclusive-title">
            <h3 id="inconclusive-title">Sans verdict</h3>
            <p>Ces promesses se sont dissipées faute de preuves suffisantes.</p>
            {inconclusivePledges.length === 0 ? (
              <HauntedEmptyState>
                Aucune promesse ne flotte ici sans verdict.
              </HauntedEmptyState>
            ) : (
              <div className="cemetery__grid">
                {inconclusivePledges.map((pledge) => (
                  <PledgeTombstone key={pledge.id} pledge={pledge} quiet />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div
          id="ai-errors-panel"
          role="tabpanel"
          aria-labelledby="ai-errors-tab"
          tabIndex={0}
        >
          {tombstones.length === 0 ? (
            <HauntedEmptyState>
              L’IA n’a encore aucune correction gravée dans la pierre.
            </HauntedEmptyState>
          ) : (
            <div className="cemetery__grid cemetery__grid--errors">
              {tombstones.map((tombstone, index) => {
                const pledge = pledgesById.get(tombstone.pledgeId)

                return (
                  <article
                    className="cemetery-card cemetery-card--ai"
                    key={`${tombstone.pledgeId}-${tombstone.date}-${index}`}
                  >
                    <StoneMarker label="Erreur de l’IA" />
                    <h3>Ici repose une erreur de l’IA</h3>
                    <p className="cemetery-card__question">
                      {pledge?.question ?? 'Promesse d’origine introuvable.'}
                    </p>
                    {pledge ? (
                      <>
                        <EvidenceChips level={pledge.evidenceLevel} />
                        <p className="cemetery-card__confidence">
                          Confiance IA :{' '}
                          {pledge.verification
                            ? `${Math.round(pledge.verification.decision.confidence * 100)} %`
                            : 'non enregistrée'}
                        </p>
                        <div className="cemetery-card__sources">
                          <p>Sources</p>
                          {pledge.sources.length === 0 ? (
                            <span>Aucune source enregistrée.</span>
                          ) : (
                            <ul>
                              {pledge.sources.map((source) => (
                                <li key={`${source.url}-${source.label}`}>
                                  {source.label}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="cemetery-card__confidence">
                        Preuves, sources et confiance indisponibles.
                      </p>
                    )}
                    <dl className="cemetery-card__correction">
                      <div>
                        <dt>Affirmation initiale de l’IA</dt>
                        <dd>{VERDICT_LABELS[tombstone.aiClaim]}</dd>
                      </div>
                      <div>
                        <dt>Correction humaine</dt>
                        <dd>{VERDICT_LABELS[tombstone.humanOutcome]}</dd>
                      </div>
                      <div>
                        <dt>Raison</dt>
                        <dd>{tombstone.reason}</dd>
                      </div>
                      <div>
                        <dt>Date</dt>
                        <dd>
                          <time dateTime={validDateTime(tombstone.date)}>
                            {formatDate(tombstone.date)}
                          </time>
                        </dd>
                      </div>
                    </dl>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
