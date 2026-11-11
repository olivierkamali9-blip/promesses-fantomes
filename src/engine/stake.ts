export type StakeValidation =
  | { ok: true }
  | {
      ok: false
      reason: 'NOT_INTEGER' | 'BELOW_MINIMUM' | 'ABOVE_BALANCE'
    }

const MINIMUM_STAKE = 10

export function validateStake(
  balance: number,
  amount: number,
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

  return { ok: true }
}
