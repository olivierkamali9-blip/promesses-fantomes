import { useState, type CSSProperties, type FormEvent } from 'react'
import type { DemoPledge } from '../data/demoPledges'
import type { FinalState, LifecycleState } from '../engine/lifecycle'
import { timeState } from '../engine/lifecycle'
import { isStakeWindowOpen, validateStake, type StakeValidation } from '../engine/stake'
import { poolPercentages, type Side } from '../engine/souls'
import { translate, type Locale } from '../i18n'
import type { Player, SimulationResult } from '../state/useGame'
import { formatCountdown, truncateStatement } from './pledgeCardProps'
import { GhostFigure } from './GhostFigure'
import './pledgePage.css'

const EVIDENCE_LABELS = [
  'Rumeur',
  'Déclaration avec lien',
  'Une source fiable',
  'Deux sources indépendantes',
  'Document officiel ou donnée primaire',
] as const

const SOURCE_KIND_LABELS: Record<DemoPledge['sources'][number]['kind'], string> = {
  statement: 'Déclaration',
  reliable: 'Source fiable',
  official: 'Document officiel',
}

const TIER_DETAILS: Record<DemoPledge['tier'], { label: string; reason: string }> = {
  GREEN: {
    label: 'Vert',
    reason: 'Événement programmé à faible risque, vérifiable par des résultats publics.',
  },
  ORANGE: {
    label: 'Orange',
    reason: 'Promesse publique sensible : une personne doit approuver la résolution.',
  },
  RED: {
    label: 'Rouge',
    reason: 'Sujet à haut risque : une personne doit approuver avant publication.',
  },
}

const OUTCOME_LABELS: Record<LifecycleState, string> = {
  MURMUR: 'Murmure',
  APPARITION: 'Ouverte',
  HAUNTING: 'Hantise',
  KEPT: 'TENUE',
  BROKEN: 'ROMPUE',
  INCONCLUSIVE: 'SANS VERDICT',
}

const VALIDATION_MESSAGES: Record<
  Exclude<StakeValidation, { ok: true }>['reason'],
  string
> = {
  NOT_INTEGER: 'La mise doit être un nombre entier.',
  BELOW_MINIMUM: 'La mise minimale est de 10 Âmes.',
  ABOVE_BALANCE: 'Votre solde ne contient pas assez d’Âmes.',
  DAILY_CAP_EXCEEDED: 'Votre plafond quotidien de mises est atteint.',
}

type SplitStyle = CSSProperties & {
  '--kept-share': `${number}%`
}

type PledgePageProps = {
  pledge: DemoPledge
  player: Player
  result?: SimulationResult
  onBack: () => void
  onStake: (pledgeId: string, side: Side, amount: number) => void
  stakedToday: number
  dailyStakeCap: number
  locale: Locale
  isVerifying: boolean
  onRunVerifiers: (pledgeId: string) => Promise<void>
  onHumanResolve: (
    pledgeId: string,
    outcome: FinalState,
    reason: string,
  ) => void
  onHumanOverride: (
    pledgeId: string,
    outcome: FinalState,
    reason: string,
  ) => void
}

function validationMessage(validation: StakeValidation): string {
  return validation.ok ? 'Mise valide.' : VALIDATION_MESSAGES[validation.reason]
}

export function PledgePage({
  pledge,
  player,
  result,
  onBack,
  onStake,
  stakedToday,
  dailyStakeCap,
  locale,
  isVerifying,
  onRunVerifiers,
  onHumanResolve,
  onHumanOverride,
}: PledgePageProps) {
  const [side, setSide] = useState<Side>('KEPT')
  const [amount, setAmount] = useState(50)
  const [confirmation, setConfirmation] = useState('')
  const [guardianReason, setGuardianReason] = useState('')
  const [showCorrection, setShowCorrection] = useState(false)
  const now = new Date()
  const state = timeState(pledge.state, now, new Date(pledge.deadline))
  const countdown = formatCountdown(new Date(pledge.deadline), now)
  const percentages = poolPercentages(pledge.stakes)
  const splitStyle: SplitStyle = { '--kept-share': `${percentages.KEPT}%` }
  const validation = validateStake(
    player.souls,
    amount,
    stakedToday,
    dailyStakeCap,
  )
  const open = state === 'APPARITION' || state === 'HAUNTING'
  const canStake = isStakeWindowOpen(
    pledge.state,
    pledge.deadline,
    now.getTime(),
  ) && !result
  const tier = TIER_DETAILS[pledge.tier]
  const verification = pledge.verification
  const displayedConfidence = verification?.decision.confidence ?? pledge.aiConfidence
  const guardianReasonReady = guardianReason.trim().length > 0
  const noMoneyNotice = translate(locale, 'notice.noMoney')
  const dailyCapLabel = translate(locale, 'notice.dailyCap')
  const statementSource = pledge.sources.find((source) => source.kind === 'statement')

  function submitStake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canStake || !validation.ok) {
      return
    }

    onStake(pledge.id, side, amount)
    setConfirmation(`${amount} Âmes mises sur ${side === 'KEPT' ? 'TENUE' : 'ROMPUE'}.`)
  }

  function submitHumanResolution(outcome: FinalState) {
    if (!guardianReasonReady) {
      return
    }

    onHumanResolve(pledge.id, outcome, guardianReason.trim())
    setGuardianReason('')
  }

  function submitHumanOverride(outcome: FinalState) {
    if (!guardianReasonReady || outcome === result?.outcome) {
      return
    }

    onHumanOverride(pledge.id, outcome, guardianReason.trim())
    setGuardianReason('')
    setShowCorrection(false)
  }

  return (
    <article className="pledge-page" aria-labelledby="pledge-page-title">
      <button className="pledge-page__back" type="button" onClick={onBack}>
        ← Retour
      </button>

      <div className="pledge-page__hero">
        <GhostFigure state={state} evidenceLevel={pledge.evidenceLevel} />
        <div>
          <div className="pledge-page__badges">
            <span>{pledge.liveSource
              ? pledge.realMatchLabel ?? (pledge.liveKind === 'UPCOMING' ? 'Match réel' : 'Résultat réel')
              : 'Scénario fictif · Fictional demo scenario'}</span>
            <span>Risque : {tier.label}</span>
            {pledge.unconfirmed && <span>Non confirmé</span>}
          </div>
          <h2 id="pledge-page-title">{pledge.question}</h2>
          <p className="pledge-page__criteria">
            <strong>Critère vérifiable :</strong> {pledge.criteria}
          </p>
          {pledge.publicStatement && (
            <blockquote className="pledge-page__statement">
              <p>{truncateStatement(pledge.publicStatement)}</p>
              {pledge.speaker && <cite>Déclaration rapportée par la source · Sujet : {pledge.speaker}</cite>}
              {statementSource && (
                <a
                  className="pledge-page__source-link"
                  href={statementSource.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Lire la source
                </a>
              )}
            </blockquote>
          )}
          <time className="pledge-page__countdown" dateTime={pledge.deadline}>
            {countdown === 'Échéance atteinte'
              ? countdown
              : `Échéance dans ${countdown}`}
          </time>
        </div>
      </div>

      <section className="pledge-page__panel" aria-labelledby="pools-title">
        <div className="pledge-page__panel-heading">
          <h3 id="pools-title">Répartition des mises</h3>
          <span>{pledge.stakes.KEPT + pledge.stakes.BROKEN} Âmes</span>
        </div>
        <div className="pledge-page__split-labels">
          <span>TENUE <strong>{percentages.KEPT}%</strong></span>
          <span>ROMPUE <strong>{percentages.BROKEN}%</strong></span>
        </div>
        <div
          className="pledge-page__split"
          role="img"
          aria-label={`${percentages.KEPT} % tenue, ${percentages.BROKEN} % rompue`}
          style={splitStyle}
        >
          <span />
          <span />
        </div>
      </section>

      <div className="pledge-page__columns">
        <form className="stake-sheet pledge-page__panel" onSubmit={submitStake}>
          <div className="pledge-page__panel-heading">
            <h3>Miser des Âmes</h3>
            <span>Votre solde : <strong>{player.souls}</strong></span>
          </div>

          <fieldset disabled={!canStake}>
            <legend>Choisissez un côté</legend>
            <div className="stake-sheet__sides">
              <button
                type="button"
                aria-pressed={side === 'KEPT'}
                onClick={() => setSide('KEPT')}
              >
                TENUE
              </button>
              <button
                type="button"
                aria-pressed={side === 'BROKEN'}
                onClick={() => setSide('BROKEN')}
              >
                ROMPUE
              </button>
            </div>

            <label htmlFor="stake-amount">Montant entier, minimum 10</label>
            <div className="stake-sheet__amount">
              <button
                type="button"
                aria-label="Retirer 10 Âmes"
                onClick={() => setAmount((current) => Math.max(0, current - 10))}
              >
                −
              </button>
              <input
                id="stake-amount"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={Number.isNaN(amount) ? '' : amount}
                onChange={(event) => setAmount(event.currentTarget.valueAsNumber)}
              />
              <button
                type="button"
                aria-label="Ajouter 10 Âmes"
                onClick={() => setAmount((current) => (Number.isNaN(current) ? 10 : current + 10))}
              >
                +
              </button>
            </div>

            <div className="stake-sheet__quick" aria-label="Montants rapides">
              {[50, 100, 250].map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(quickAmount)}
                >
                  {quickAmount}
                </button>
              ))}
            </div>
          </fieldset>

          <p
            className={`stake-sheet__validation${validation.ok ? '' : ' stake-sheet__validation--error'}`}
            role="status"
          >
            {canStake
              ? validationMessage(validation)
              : 'Les mises sont fermées pour cette promesse.'}
          </p>
          {confirmation && <p className="stake-sheet__confirmation">{confirmation}</p>}
          <button
            className="stake-sheet__submit"
            type="submit"
            disabled={!canStake || !validation.ok}
          >
            Confirmer la mise
          </button>

          <p className="stake-sheet__notice">
            {dailyCapLabel} : {stakedToday} / {dailyStakeCap} Âmes. {noMoneyNotice}
          </p>
        </form>

        <section className="ai-belief pledge-page__panel" aria-labelledby="ai-belief-title">
          <p className="pledge-page__eyebrow">Oracle transparent</p>
          <h3 id="ai-belief-title">Pourquoi l’IA le croit</h3>

          <div className="ai-belief__summary">
            <p><strong>Niveau de preuve :</strong> L{pledge.evidenceLevel}</p>
            <p><strong>Confiance :</strong>{' '}
              {displayedConfidence === undefined
                ? 'Non évaluée'
                : `${Math.round(displayedConfidence * 100)} %`}
            </p>
            <p><strong>Risque {tier.label} :</strong> {tier.reason}</p>
          </div>

          <ol className="evidence-ladder" aria-label="Échelle des preuves">
            {EVIDENCE_LABELS.map((label, level) => (
              <li
                key={label}
                aria-current={level === pledge.evidenceLevel ? 'step' : undefined}
              >
                <strong>L{level}</strong>
                <span>{label}</span>
              </li>
            ))}
          </ol>

          <h4>Sources visibles</h4>
          <ul className="ai-belief__sources">
            {pledge.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.label}
                </a>
                <span>{SOURCE_KIND_LABELS[source.kind]} · groupe {source.independentGroup}</span>
              </li>
            ))}
          </ul>
          <p className="ai-belief__rule">Résolution autorisée uniquement à L3 ou L4</p>
        </section>
      </div>

      <section className="spirit-verdict pledge-page__panel" aria-labelledby="spirit-verdict-title">
        <div className="pledge-page__panel-heading">
          <div>
            <p className="pledge-page__eyebrow">Contrôle croisé, sources fictives</p>
            <h3 id="spirit-verdict-title">Verdict des trois esprits</h3>
          </div>
          <button
            type="button"
            disabled={!open || Boolean(result) || isVerifying}
            onClick={() => void onRunVerifiers(pledge.id)}
          >
            {isVerifying
              ? 'Vérification en cours…'
              : 'Lancer les vérificateurs (démo)'}
          </button>
        </div>

        {verification ? (
          <div aria-live="polite">
            <div className="spirit-verdict__checks">
              {verification.checks.map((check) => (
                <article className="spirit-check" key={check.name}>
                  <h4>{check.name}</h4>
                  <p className="spirit-check__outcome">
                    {OUTCOME_LABELS[check.outcome]}
                  </p>
                  <p>Confiance : <strong>{Math.round(check.confidence * 100)} %</strong></p>
                  <ul>
                    {check.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <div className="spirit-decision">
              <p>
                Décision : <strong>
                  {verification.decision.action === 'AUTO_RESOLVE'
                    ? 'Résolution automatique'
                    : 'Examen humain'}
                </strong>
              </p>
              <p>
                Avis proposé : <strong>
                  {OUTCOME_LABELS[verification.decision.outcome]}
                </strong> · confiance moyenne{' '}
                {Math.round(verification.decision.confidence * 100)} %
              </p>
              <p>{verification.decision.reason}</p>
            </div>
          </div>
        ) : (
          <p className="demo-resolution__empty">
            Les trois esprits n’ont pas encore examiné cette promesse.
          </p>
        )}

        {verification?.decision.action === 'HUMAN_REVIEW' && !result && (
          <div className="guardian-resolution">
            <h4>Décision du Gardien</h4>
            <label htmlFor="guardian-reason">Raison obligatoire</label>
            <textarea
              id="guardian-reason"
              required
              value={guardianReason}
              onChange={(event) => setGuardianReason(event.target.value)}
            />
            <div className="guardian-resolution__actions">
              <button
                type="button"
                disabled={!guardianReasonReady}
                onClick={() => submitHumanResolution('KEPT')}
              >
                Tenue
              </button>
              <button
                type="button"
                disabled={!guardianReasonReady}
                onClick={() => submitHumanResolution('BROKEN')}
              >
                Rompue
              </button>
              <button
                type="button"
                disabled={!guardianReasonReady}
                onClick={() => submitHumanResolution('INCONCLUSIVE')}
              >
                Sans verdict
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="demo-resolution__result" aria-live="polite">
            <p>Verdict : <strong>{OUTCOME_LABELS[result.outcome]}</strong></p>
            <p>Votre nouveau solde : <strong>{result.playerSouls} Âmes</strong></p>
            <p>Motif : {result.reason}</p>
            <h4>Paiements des parieurs fictifs</h4>
            <ul>
              {result.payouts.filter((payout) => payout.fictional).map((payout) => (
                <li key={payout.userId}>
                  <span>{payout.name} · {payout.side === 'KEPT' ? 'TENUE' : 'ROMPUE'}</span>
                  <strong>{payout.payout} Âmes</strong>
                </li>
              ))}
            </ul>

            {result.resolvedBy === 'ai' && !showCorrection && (
              <button
                type="button"
                className="guardian-resolution__correction"
                onClick={() => setShowCorrection(true)}
              >
                Corriger (erreur de l’IA)
              </button>
            )}

            {result.resolvedBy === 'ai' && showCorrection && (
              <div className="guardian-resolution">
                <h4>Graver la correction</h4>
                <label htmlFor="override-reason">Raison obligatoire</label>
                <textarea
                  id="override-reason"
                  required
                  value={guardianReason}
                  onChange={(event) => setGuardianReason(event.target.value)}
                />
                <div className="guardian-resolution__actions">
                  {(['KEPT', 'BROKEN', 'INCONCLUSIVE'] as const).map((outcome) => (
                    <button
                      key={outcome}
                      type="button"
                      disabled={!guardianReasonReady || outcome === result.outcome}
                      onClick={() => submitHumanOverride(outcome)}
                    >
                      {OUTCOME_LABELS[outcome]}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setShowCorrection(false)
                      setGuardianReason('')
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </article>
  )
}
