import {
  BLOCKED_KEYWORDS,
  ORANGE_KEYWORDS,
  RED_KEYWORDS,
} from './safety.rules'

export type SafetyTier = 'GREEN' | 'ORANGE' | 'RED' | 'BLOCKED'

export type SafetyClassification = {
  tier: SafetyTier
  reason: string
}

export type ApprovalPolicy = {
  autoPublish: boolean
  needsApprovalBeforePublish: boolean
  needsApprovalToResolve: boolean
}

const TIER_ORDER: Record<SafetyTier, number> = {
  GREEN: 0,
  ORANGE: 1,
  RED: 2,
  BLOCKED: 3,
}

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr')
}

function findKeyword(
  normalizedText: string,
  keywords: readonly string[],
): string | undefined {
  return keywords.find((keyword) =>
    normalizedText.includes(normalizeText(keyword)),
  )
}

export function classifyByRules(text: string): SafetyClassification {
  const normalizedText = normalizeText(text)
  const blockedKeyword = findKeyword(normalizedText, BLOCKED_KEYWORDS)

  if (blockedKeyword !== undefined) {
    return {
      tier: 'BLOCKED',
      reason: `Blocked keyword: ${blockedKeyword}`,
    }
  }

  const redKeyword = findKeyword(normalizedText, RED_KEYWORDS)

  if (redKeyword !== undefined) {
    return {
      tier: 'RED',
      reason: `Red keyword: ${redKeyword}`,
    }
  }

  const orangeKeyword = findKeyword(normalizedText, ORANGE_KEYWORDS)

  if (orangeKeyword !== undefined) {
    return {
      tier: 'ORANGE',
      reason: `Orange keyword: ${orangeKeyword}`,
    }
  }

  return {
    tier: 'GREEN',
    reason: 'No safety keyword matched',
  }
}

export function mergeTier(
  ruleTier: SafetyTier,
  modelTier: SafetyTier,
): SafetyTier {
  return TIER_ORDER[ruleTier] >= TIER_ORDER[modelTier]
    ? ruleTier
    : modelTier
}

export function approvalPolicy(tier: SafetyTier): ApprovalPolicy {
  if (tier === 'GREEN') {
    return {
      autoPublish: true,
      needsApprovalBeforePublish: false,
      needsApprovalToResolve: false,
    }
  }

  if (tier === 'ORANGE') {
    return {
      autoPublish: true,
      needsApprovalBeforePublish: false,
      needsApprovalToResolve: true,
    }
  }

  if (tier === 'RED') {
    return {
      autoPublish: false,
      needsApprovalBeforePublish: true,
      needsApprovalToResolve: true,
    }
  }

  return {
    autoPublish: false,
    needsApprovalBeforePublish: false,
    needsApprovalToResolve: false,
  }
}
