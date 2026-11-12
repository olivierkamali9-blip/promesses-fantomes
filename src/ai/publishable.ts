import type { Draft } from './types'

export type PublishableResult =
  | { ok: true }
  | { ok: false; reasons: string[] }

export function validatePublishable(draft: Draft): PublishableResult {
  const reasons: string[] = []

  if (draft.criteria.trim().length === 0) {
    reasons.push('Les critères de résolution sont requis.')
  }

  const deadlineTime = Date.parse(draft.deadline)
  if (!Number.isFinite(deadlineTime) || deadlineTime <= Date.now()) {
    reasons.push('L’échéance doit être une date future valide.')
  }

  if (!draft.sources.some((source) => source.url.trim().length > 0)) {
    reasons.push('Au moins une source est requise.')
  }

  return reasons.length === 0 ? { ok: true } : { ok: false, reasons }
}
