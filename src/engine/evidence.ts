export type SourceKind = 'statement' | 'reliable' | 'official'

export type Source = {
  url: string
  kind: SourceKind
  independentGroup: string
}

export type EvidenceLevel = 0 | 1 | 2 | 3 | 4
export type ProposedOutcome = 'KEPT' | 'BROKEN'
export type Resolution =
  | { status: 'RESOLVED'; outcome: ProposedOutcome }
  | { status: 'INCONCLUSIVE' }

export function evidenceLevel(sources: Source[]): EvidenceLevel {
  if (sources.some((source) => source.kind === 'official')) {
    return 4
  }

  const reliableGroups = new Set(
    sources
      .filter((source) => source.kind === 'reliable')
      .map((source) => source.independentGroup),
  )

  if (reliableGroups.size >= 2) {
    return 3
  }

  if (reliableGroups.size === 1) {
    return 2
  }

  return sources.length > 0 ? 1 : 0
}

export function canResolve(level: EvidenceLevel): boolean {
  return level === 3 || level === 4
}

export function resolveOutcome(
  sources: Source[],
  proposed: ProposedOutcome,
): Resolution {
  if (!canResolve(evidenceLevel(sources))) {
    return { status: 'INCONCLUSIVE' }
  }

  return { status: 'RESOLVED', outcome: proposed }
}
