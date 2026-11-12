import type { EvidenceLevel } from '../engine/evidence'
import type { SafetyTier } from '../engine/safety'
import type { VerifierCheck, VerifierOutcome } from './verifier'

export type ConsensusDecision = {
  action: 'AUTO_RESOLVE' | 'HUMAN_REVIEW'
  outcome: VerifierOutcome
  confidence: number
  reason: string
}

function meanConfidence(checks: readonly VerifierCheck[]): number {
  if (checks.length === 0) {
    return 0
  }

  return checks.reduce((sum, check) => sum + check.confidence, 0) / checks.length
}

export function decideResolution(
  checks: readonly VerifierCheck[],
  evidenceLevel: EvidenceLevel,
  tier: SafetyTier = 'GREEN',
): ConsensusDecision {
  const confidence = meanConfidence(checks)
  const names = new Set(checks.map((check) => check.name))
  const hasThreeIndependentChecks = checks.length === 3 && names.size === 3
  const firstOutcome = checks[0]?.outcome ?? 'INCONCLUSIVE'
  const allAgree =
    hasThreeIndependentChecks &&
    checks.every((check) => check.outcome === firstOutcome)
  const conclusiveAgreement =
    allAgree && (firstOutcome === 'KEPT' || firstOutcome === 'BROKEN')

  if (tier === 'ORANGE' || tier === 'RED' || tier === 'BLOCKED') {
    return {
      action: 'HUMAN_REVIEW',
      outcome: conclusiveAgreement ? firstOutcome : 'INCONCLUSIVE',
      confidence,
      reason: `Le niveau ${tier} exige la décision du Gardien.`,
    }
  }

  if (!hasThreeIndependentChecks) {
    return {
      action: 'HUMAN_REVIEW',
      outcome: 'INCONCLUSIVE',
      confidence,
      reason: 'Trois vérifications indépendantes sont requises.',
    }
  }

  if (!allAgree || firstOutcome === 'INCONCLUSIVE') {
    return {
      action: 'HUMAN_REVIEW',
      outcome: 'INCONCLUSIVE',
      confidence,
      reason: !allAgree
        ? 'Les trois esprits ne sont pas d’accord.'
        : 'Les trois esprits demandent davantage de preuves.',
    }
  }

  if (evidenceLevel < 3) {
    return {
      action: 'HUMAN_REVIEW',
      outcome: firstOutcome,
      confidence,
      reason: `Le niveau de preuve L${evidenceLevel} est inférieur au seuil L3.`,
    }
  }

  if (confidence < 0.8) {
    return {
      action: 'HUMAN_REVIEW',
      outcome: firstOutcome,
      confidence,
      reason: 'La confiance moyenne est inférieure à 80 %.',
    }
  }

  return {
    action: 'AUTO_RESOLVE',
    outcome: firstOutcome,
    confidence,
    reason: 'Les trois esprits concordent avec des preuves et une confiance suffisantes.',
  }
}
