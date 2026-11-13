import { translate, type Locale, type TranslationKey } from '../i18n'
import type { Preferences } from '../state/usePreferences'
import './accountPages.css'

type SettingsProps = {
  preferences: Preferences
  onChange: (patch: Partial<Preferences>) => void
  onResetDemo: () => void
}

export function Settings({ preferences, onChange, onResetDemo }: SettingsProps) {
  const locale: Locale = preferences.locale
  const t = (key: TranslationKey) => translate(locale, key)

  function resetDemo() {
    if (window.confirm(t('settings.resetConfirm'))) onResetDemo()
  }

  return (
    <section className="account-page settings-page" aria-labelledby="settings-title">
      <div className="account-page__heading">
        <div>
          <p className="account-page__eyebrow">{t('settings.eyebrow')}</p>
          <h2 id="settings-title">{t('settings.title')}</h2>
        </div>
        <a className="account-page__button" href="#/profil">{t('settings.backProfile')}</a>
      </div>

      <fieldset className="settings-page__group">
        <legend>{t('settings.language')}</legend>
        <label className="settings-page__field">
          <span>{t('settings.language')}</span>
          <select value={locale} onChange={(event) => onChange({ locale: event.target.value as Locale })}>
            <option value="fr">{t('settings.french')}</option>
            <option value="en">{t('settings.english')}</option>
          </select>
        </label>
      </fieldset>

      <fieldset className="settings-page__group">
        <legend>{t('settings.display')}</legend>
        <label className="settings-page__toggle">
          <span>{t('settings.reduceMotion')}</span>
          <input type="checkbox" checked={preferences.reduceMotion} onChange={(event) => onChange({ reduceMotion: event.target.checked })} />
        </label>
        <label className="settings-page__toggle">
          <span>{t('settings.dataSaver')}</span>
          <input type="checkbox" checked={preferences.dataSaver} onChange={(event) => onChange({ dataSaver: event.target.checked })} />
        </label>
      </fieldset>

      <fieldset className="settings-page__group">
        <legend>{t('settings.dailyCap')}</legend>
        <label className="settings-page__field">
          <span>{t('settings.dailyCap')}</span>
          <input type="number" min="10" step="10" inputMode="numeric" value={preferences.dailyStakeCap} onChange={(event) => {
            const value = event.currentTarget.valueAsNumber
            if (Number.isSafeInteger(value) && value >= 10) onChange({ dailyStakeCap: value })
          }} />
        </label>
        <p className="settings-page__help">{t('settings.dailyCapHelp')}</p>
      </fieldset>

      <button type="button" onClick={resetDemo}>{t('settings.reset')}</button>
      <p className="settings-page__help" role="status">{t('settings.saved')}</p>

      <section className="account-page__card settings-page__about" aria-labelledby="about-title">
        <h3 id="about-title">{t('settings.about')}</h3>
        <p><strong>{t('notice.noMoney')}</strong></p>
        <p>{t('settings.agents')}</p>
        <p>{t('settings.credits')}</p>
        <p>{t('settings.license')}</p>
        <p>{t('settings.sources')}</p>
      </section>
    </section>
  )
}
