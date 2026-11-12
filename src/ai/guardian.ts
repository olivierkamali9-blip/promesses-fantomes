import {
  approvalPolicy,
  classifyByRules,
  mergeTier,
  type SafetyTier,
} from '../engine/safety'
import { validatePublishable } from './publishable'
import type { Draft } from './types'

export type GuardianDecision = {
  action: 'PUBLISH' | 'QUEUE_APPROVAL' | 'REJECT'
  tier: SafetyTier
  reason: string
}

function draftSafetyText(draft: Draft): string {
  return [
    draft.question,
    draft.criteria,
    draft.sides.kept.argument,
    draft.sides.broken.argument,
  ].join(' ')
}

export function decide(draft: Draft): GuardianDecision {
  const ruleTier = classifyByRules(draftSafetyText(draft)).tier
  const tier = mergeTier(ruleTier, draft.modelTier)
  const publishable = validatePublishable(draft)

  if (!publishable.ok) {
    return {
      action: 'REJECT',
      tier,
      reason: publishable.reasons.join(' '),
    }
  }

  if (tier === 'BLOCKED') {
    return {
      action: 'REJECT',
      tier,
      reason: 'Le contenu enfreint une règle de sécurité explicite.',
    }
  }

  const policy = approvalPolicy(tier)
  if (policy.needsApprovalBeforePublish) {
    return {
      action: 'QUEUE_APPROVAL',
      tier,
      reason: 'Une approbation humaine est requise avant publication.',
    }
  }

  if (tier === 'ORANGE') {
    return {
      action: 'PUBLISH',
      tier,
      reason: 'Publication autorisée avec la mention UNCONFIRMED.',
    }
  }

  return {
    action: 'PUBLISH',
    tier,
    reason: 'Publication automatique autorisée.',
  }
}
