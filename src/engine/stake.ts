import type { Stake } from './souls'

export type StakeValidation =
  | { ok: true }
  | {
      ok: false
      reason:
        | 'NOT_INTEGER'
        | 'BELOW_MINIMUM'
        | 'ABOVE_BALANCE'
        | 'DAILY_CAP_EXCEEDED'
    }

const MINIMUM_STAKE = 10
export const DEFAULT_DAILY_STAKE_CAP = 500

export function totalStakedOnDay(
  stakes: readonly Pick<Stake, 'amount' | 'at'>[],
  at: number,
): number {
  const date = new Date(at)
  const start = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime()
  const end = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1,
  ).getTime()

  return stakes
    .filter((stake) => stake.at >= start && stake.at < end)
    .reduce((total, stake) => total + stake.amount, 0)
}

function staysWithinDailyStakeCap(
  stakedToday: number,
  amount: number,
  dailyCap: number,
): boolean {
  return Number.isSafeInteger(stakedToday) &&
    Number.isSafeInteger(dailyCap) &&
    stakedToday >= 0 &&
    dailyCap >= MINIMUM_STAKE &&
    stakedToday + amount <= dailyCap
}

export function validateStake(
  balance: number,
  amount: number,
  stakedToday = 0,
  dailyCap = DEFAULT_DAILY_STAKE_CAP,
): StakeValidation {
  if (!Number.isInteger(amount)) {
    return { ok: false, reason: 'NOT_INTEGER' }
  }

  if (amount < MINIMUM_STAKE) {
    return { ok: false, reason: 'BELOW_MINIMUM' }
  }

  if (amount > balance) {
    return { ok: false, reason: 'ABOVE_BALANCE' }
  }

  if (!staysWithinDailyStakeCap(stakedToday, amount, dailyCap)) {
    return { ok: false, reason: 'DAILY_CAP_EXCEEDED' }
  }

  return { ok: true }
}
