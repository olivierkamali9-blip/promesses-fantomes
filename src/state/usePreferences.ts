import { useEffect, useState } from 'react'
import type { Locale } from '../i18n'
import { DEFAULT_DAILY_STAKE_CAP } from '../engine/stake'

const STORAGE_KEY = 'promesses-fantomes-preferences'

export type Preferences = {
  locale: Locale
  reduceMotion: boolean
  dataSaver: boolean
  dailyStakeCap: number
}

function systemPrefersReducedMotion(): boolean {
  return typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

function loadPreferences(): Preferences {
  const defaults: Preferences = {
    locale: 'fr',
    reduceMotion: systemPrefersReducedMotion(),
    dataSaver: false,
    dailyStakeCap: DEFAULT_DAILY_STAKE_CAP,
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return defaults

    const value = JSON.parse(stored) as Partial<Preferences>
    return {
      locale: value.locale === 'en' ? 'en' : 'fr',
      reduceMotion: typeof value.reduceMotion === 'boolean'
        ? value.reduceMotion
        : defaults.reduceMotion,
      dataSaver: value.dataSaver === true,
      dailyStakeCap: Number.isSafeInteger(value.dailyStakeCap) &&
        (value.dailyStakeCap ?? 0) >= 10
        ? value.dailyStakeCap as number
        : DEFAULT_DAILY_STAKE_CAP,
    }
  } catch {
    return defaults
  }
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch {
      // Preferences remain available for the current session.
    }
  }, [preferences])

  function updatePreferences(patch: Partial<Preferences>) {
    setPreferences((current) => ({ ...current, ...patch }))
  }

  return { preferences, updatePreferences }
}
