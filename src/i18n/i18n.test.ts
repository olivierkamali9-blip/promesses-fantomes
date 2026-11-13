import { describe, expect, it } from 'vitest'
import { translations } from './index'

describe('i18n dictionaries', () => {
  it('contains every key in both languages', () => {
    expect(Object.keys(translations.en).sort()).toEqual(
      Object.keys(translations.fr).sort(),
    )
  })
})
