import {
  BLOCKED_KEYWORDS,
  GREEN_KEYWORDS,
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

function tokenize(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('fr')
    .split(/[^\p{L}]+/u)
    .filter((token) => token.length > 0)
}

function containsSequence(tokens: readonly string[], sequence: readonly string[]) {
  if (sequence.length === 0 || sequence.length > tokens.length) {
    return false
  }

  return tokens.some((_, startIndex) =>
    sequence.every(
      (sequenceToken, offset) => tokens[startIndex + offset] === sequenceToken,
    ),
  )
}

function findKeyword(
  tokens: readonly string[],
  keywords: readonly string[],
): string | undefined {
  return keywords.find((keyword) => containsSequence(tokens, tokenize(keyword)))
}

export function classifyByRules(text: string): SafetyClassification {
  const tokens = tokenize(text)
  const blockedKeyword = findKeyword(tokens, BLOCKED_KEYWORDS)

  if (blockedKeyword !== undefined) {
    return {
      tier: 'BLOCKED',
      reason: `Blocked keyword: ${blockedKeyword}`,
    }
  }

  const redKeyword = findKeyword(tokens, RED_KEYWORDS)

  if (redKeyword !== undefined) {
    return {
      tier: 'RED',
      reason: `Red keyword: ${redKeyword}`,
    }
  }

  const orangeKeyword = findKeyword(tokens, ORANGE_KEYWORDS)

  if (orangeKeyword !== undefined) {
    return {
      tier: 'ORANGE',
      reason: `Orange keyword: ${orangeKeyword}`,
    }
  }

  const greenKeyword = findKeyword(tokens, GREEN_KEYWORDS)

  if (greenKeyword !== undefined) {
    return {
      tier: 'GREEN',
      reason: `Sport or schedule keyword: ${greenKeyword}`,
    }
  }

  return {
    tier: 'ORANGE',
    reason: 'No safety or sport/schedule keyword matched',
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
