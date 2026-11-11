export type Side = 'KEPT' | 'BROKEN'

export type Stake = {
  userId: string
  side: Side
  amount: number
  at: number
}

export type Settlement = {
  kind: 'PAYOUT' | 'REFUND'
  payouts: number[]
}

type WinnerShare = {
  index: number
  at: number
  base: bigint
  remainder: bigint
}

export type PoolPercentages = Record<Side, number>

export function poolPercentages(
  pools: Readonly<Record<Side, number>>,
): PoolPercentages {
  if (
    !Number.isSafeInteger(pools.KEPT) ||
    !Number.isSafeInteger(pools.BROKEN) ||
    pools.KEPT < 0 ||
    pools.BROKEN < 0
  ) {
    throw new Error('Stake pools must be non-negative safe integers')
  }

  const total = pools.KEPT + pools.BROKEN

  if (total === 0) {
    return { KEPT: 50, BROKEN: 50 }
  }

  const kept = Math.round((pools.KEPT * 100) / total)
  return { KEPT: kept, BROKEN: 100 - kept }
}

export function settlePledge(stakes: Stake[], winningSide: Side): Settlement {
  for (const stake of stakes) {
    if (!Number.isInteger(stake.amount) || stake.amount <= 0) {
      throw new Error('Stake amounts must be positive integers')
    }
  }

  const winningIndexes = stakes
    .map((stake, index) => ({ stake, index }))
    .filter(({ stake }) => stake.side === winningSide)

  if (winningIndexes.length === 0) {
    return {
      kind: 'REFUND',
      payouts: stakes.map((stake) => stake.amount),
    }
  }

  const pool = stakes.reduce((total, stake) => total + BigInt(stake.amount), 0n)
  const winningPool = winningIndexes.reduce(
    (total, { stake }) => total + BigInt(stake.amount),
    0n,
  )

  const shares: WinnerShare[] = winningIndexes.map(({ stake, index }) => {
    const numerator = BigInt(stake.amount) * pool

    return {
      index,
      at: stake.at,
      base: numerator / winningPool,
      remainder: numerator % winningPool,
    }
  })

  const allocated = shares.reduce((total, share) => total + share.base, 0n)
  const remaining = Number(pool - allocated)
  const rankedShares = [...shares].sort((left, right) => {
    if (left.remainder !== right.remainder) {
      return left.remainder > right.remainder ? -1 : 1
    }

    if (left.at !== right.at) {
      return left.at - right.at
    }

    return left.index - right.index
  })

  const payouts = stakes.map(() => 0)

  for (const share of shares) {
    payouts[share.index] = Number(share.base)
  }

  for (let rank = 0; rank < remaining; rank += 1) {
    payouts[rankedShares[rank].index] += 1
  }

  return { kind: 'PAYOUT', payouts }
}
