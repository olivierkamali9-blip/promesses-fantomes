import { describe, expect, it } from 'vitest'
import { formatCountdown } from './pledgeCardProps'

describe('formatCountdown', () => {
  const now = new Date('2030-01-01T12:00:00.000Z')

  it('formats minutes, hours, days, and elapsed deadlines', () => {
    expect(formatCountdown(new Date('2030-01-01T12:45:00.000Z'), now)).toBe(
      '45 min',
    )
    expect(formatCountdown(new Date('2030-01-01T18:00:00.000Z'), now)).toBe(
      '6 h',
    )
    expect(formatCountdown(new Date('2030-01-03T12:00:00.000Z'), now)).toBe(
      '2 j',
    )
    expect(formatCountdown(new Date('2030-01-01T11:59:00.000Z'), now)).toBe(
      'Échéance atteinte',
    )
  })
})
