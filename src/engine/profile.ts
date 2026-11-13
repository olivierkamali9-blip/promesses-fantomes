export type ProphetRankTitle = 'NOVICE' | 'MEDIUM' | 'ORACLE'

export type ProphetRank = {
  percentage: number
  title: ProphetRankTitle
  wins: number
  settled: number
}

export function calculateProphetRank(
  settledResults: readonly boolean[],
): ProphetRank {
  const wins = settledResults.filter(Boolean).length
  const settled = settledResults.length
  const percentage = Math.round(((wins + 1) / (settled + 2)) * 100)
  const title: ProphetRankTitle = percentage >= 75
    ? 'ORACLE'
    : percentage >= 60
      ? 'MEDIUM'
      : 'NOVICE'

  return { percentage, title, wins, settled }
}
