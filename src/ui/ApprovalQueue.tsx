import { useState, type FormEvent } from 'react'
import { evidenceLevel } from '../engine/evidence'
import type { SafetyTier } from '../engine/safety'
import type {
  DecisionAction,
  DecisionLogEntry,
  DraftEdits,
  DraftQueueItem,
} from '../state/useGame'
import { GhostFigure } from './GhostFigure'
import './approvalQueue.css'

const TIER_LABELS: Record<SafetyTier, string> = {
  GREEN: 'Vert',
  ORANGE: 'Orange',
  RED: 'Rouge',
  BLOCKED: 'Bloqué',
}

const ACTION_LABELS: Record<DecisionAction, string> = {
  GENERATE_DRAFTS: 'Génération et classement',
  APPROVE_DRAFT: 'Approbation',
  EDIT_DRAFT: 'Modification',
  REJECT_DRAFT: 'Rejet',
}

type DraftEditor = DraftEdits & {
  draftId: string
}

type ApprovalQueueProps = {
  drafts: readonly DraftQueueItem[]
  decisions: readonly DecisionLogEntry[]
  isGenerating: boolean
  onGenerate: () => Promise<void>
  onApprove: (draftId: string) => void
  onEdit: (draftId: string, edits: DraftEdits) => void
  onReject: (draftId: string, reason: string) => void
}

function deadlineInputValue(deadline: string): string {
  const parsed = new Date(deadline)
  if (!Number.isFinite(parsed.getTime())) {
    return ''
  }

  const offset = parsed.getTimezoneOffset() * 60_000
  return new Date(parsed.getTime() - offset).toISOString().slice(0, 16)
}

function deadlineFromInput(value: string): string {
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : value
}

export function ApprovalQueue({
  drafts,
  decisions,
  isGenerating,
  onGenerate,
  onApprove,
  onEdit,
  onReject,
}: ApprovalQueueProps) {
  const [editor, setEditor] = useState<DraftEditor | null>(null)
  const [rejectionId, setRejectionId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  function startEditing(item: DraftQueueItem) {
    setRejectionId(null)
    setEditor({
      draftId: item.id,
      question: item.draft.question,
      criteria: item.draft.criteria,
      deadline: deadlineInputValue(item.draft.deadline),
    })
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editor) {
      return
    }

    onEdit(editor.draftId, {
      question: editor.question,
      criteria: editor.criteria,
      deadline: deadlineFromInput(editor.deadline),
    })
    setEditor(null)
  }

  function submitRejection(event: FormEvent<HTMLFormElement>, draftId: string) {
    event.preventDefault()
    if (rejectionReason.trim().length === 0) {
      return
    }

    onReject(draftId, rejectionReason)
    setRejectionId(null)
    setRejectionReason('')
  }

  return (
    <section className="approval-queue" aria-labelledby="guardian-title">
      <div className="approval-queue__heading">
        <p className="approval-queue__eyebrow">Contrôle humain</p>
        <h2 id="guardian-title">File du Gardien</h2>
        <p>
          Les sujets sensibles restent ici jusqu’à une décision humaine.
        </p>
      </div>

      <div className="approval-queue__generator">
        <strong>Brouillons générés à partir de sources fictives</strong>
        <button
          type="button"
          disabled={isGenerating}
          onClick={() => void onGenerate()}
        >
          {isGenerating
            ? 'Génération en cours…'
            : 'Générer des brouillons (démo)'}
        </button>
      </div>

      <div className="approval-queue__waiting" aria-live="polite">
        <h3>
          En attente <span>{drafts.length}</span>
        </h3>
        {drafts.length === 0 ? (
          <p className="approval-queue__empty">
            Aucun brouillon n’attend une approbation.
          </p>
        ) : (
          <div className="approval-queue__cards">
            {drafts.map((item) => {
              const isEditing = editor?.draftId === item.id
              const isRejecting = rejectionId === item.id

              return (
                <article className="approval-card" key={item.id}>
                  <div className="approval-card__summary">
                    <GhostFigure
                      state="MURMUR"
                      evidenceLevel={evidenceLevel(item.draft.sources)}
                      compact
                    />
                    <div>
                      <span
                        className={`approval-card__tier approval-card__tier--${item.decision.tier.toLowerCase()}`}
                      >
                        {TIER_LABELS[item.decision.tier]}
                      </span>
                      <h4>{item.draft.question}</h4>
                    </div>
                  </div>

                  <dl className="approval-card__details">
                    <div>
                      <dt>Critères</dt>
                      <dd>{item.draft.criteria}</dd>
                    </div>
                    <div>
                      <dt>Échéance</dt>
                      <dd>
                        <time dateTime={item.draft.deadline}>
                          {new Date(item.draft.deadline).toLocaleString('fr-FR')}
                        </time>
                      </dd>
                    </div>
                    <div>
                      <dt>Raison du niveau</dt>
                      <dd>{item.decision.reason}</dd>
                    </div>
                  </dl>

                  <div className="approval-card__sources">
                    <h5>Sources fictives</h5>
                    <ul>
                      {item.draft.sources.map((source, index) => (
                        <li key={`${source.url}-${index}`}>
                          <a href={source.url}>Source {index + 1}</a>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isEditing ? (
                    <form className="approval-form" onSubmit={submitEdit}>
                      <label>
                        Question
                        <textarea
                          required
                          value={editor.question}
                          onChange={(event) =>
                            setEditor({ ...editor, question: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        Critères de résolution
                        <textarea
                          required
                          value={editor.criteria}
                          onChange={(event) =>
                            setEditor({ ...editor, criteria: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        Échéance
                        <input
                          required
                          type="datetime-local"
                          value={editor.deadline}
                          onChange={(event) =>
                            setEditor({ ...editor, deadline: event.target.value })
                          }
                        />
                      </label>
                      <div className="approval-form__actions">
                        <button type="submit">Enregistrer</button>
                        <button type="button" onClick={() => setEditor(null)}>
                          Annuler
                        </button>
                      </div>
                    </form>
                  ) : isRejecting ? (
                    <form
                      className="approval-form"
                      onSubmit={(event) => submitRejection(event, item.id)}
                    >
                      <label>
                        Raison du rejet
                        <textarea
                          required
                          autoFocus
                          value={rejectionReason}
                          onChange={(event) => setRejectionReason(event.target.value)}
                        />
                      </label>
                      <div className="approval-form__actions">
                        <button type="submit">Confirmer le rejet</button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectionId(null)
                            setRejectionReason('')
                          }}
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="approval-card__actions">
                      <button
                        type="button"
                        disabled={item.decision.tier === 'BLOCKED'}
                        onClick={() => onApprove(item.id)}
                      >
                        Approuver
                      </button>
                      <button type="button" onClick={() => startEditing(item)}>
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditor(null)
                          setRejectionId(item.id)
                          setRejectionReason('')
                        }}
                      >
                        Rejeter
                      </button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>

      <section className="decision-log" aria-labelledby="decision-log-title">
        <h3 id="decision-log-title">Journal des décisions</h3>
        {decisions.length === 0 ? (
          <p className="approval-queue__empty">Aucune décision enregistrée.</p>
        ) : (
          <ol>
            {[...decisions].reverse().map((entry) => (
              <li key={entry.id}>
                <div className="decision-log__meta">
                  <strong>{ACTION_LABELS[entry.action]}</strong>
                  <span>{entry.actor === 'ai' ? 'IA' : 'Humain'}</span>
                  <time dateTime={new Date(entry.time).toISOString()}>
                    {new Date(entry.time).toLocaleString('fr-FR')}
                  </time>
                </div>
                <p>{entry.reason}</p>
                {entry.subjects.map((subject) => (
                  <div
                    className={`decision-log__subject${
                      subject.tier === 'BLOCKED'
                        ? ' decision-log__subject--blocked'
                        : ''
                    }`}
                    key={`${entry.id}-${subject.draftId}`}
                  >
                    <span>{TIER_LABELS[subject.tier]}</span>
                    <strong>{subject.question}</strong>
                    <p>{subject.reason}</p>
                  </div>
                ))}
              </li>
            ))}
          </ol>
        )}
      </section>
    </section>
  )
}
