import type { DemoPledge } from '../data/demoPledges'
import { calculateProphetRank } from '../engine/profile'
import { translate, type Locale, type TranslationKey } from '../i18n'
import type { Player, PlayerStake, SimulationResult } from '../state/useGame'
import './accountPages.css'

type ProfileProps = {
  player: Player
  stakes: readonly PlayerStake[]
  pledges: readonly DemoPledge[]
  resolutions: Readonly<Record<string, SimulationResult>>
  locale: Locale
}

export function Profile({ player, stakes, pledges, resolutions, locale }: ProfileProps) {
  const t = (key: TranslationKey) => translate(locale, key)
  const settledResults = stakes.flatMap((stake) => {
    const result = resolutions[stake.pledgeId]
    return result && result.outcome !== 'INCONCLUSIVE'
      ? [result.outcome === stake.side]
      : []
  })
  const rank = calculateProphetRank(settledResults)
  const openCount = stakes.filter((stake) => !resolutions[stake.pledgeId]).length

  return (
    <section className="account-page" aria-labelledby="profile-title">
      <div className="account-page__heading">
        <div>
          <p className="account-page__eyebrow">{player.name}</p>
          <h2 id="profile-title">{t('profile.title')}</h2>
        </div>
        <a className="account-page__button" href="#/parametres">{t('profile.settings')}</a>
      </div>

      <section className="account-page__card prophet-rank" aria-labelledby="rank-title">
        <h3 id="rank-title">{t('profile.rank')}</h3>
        <div className="prophet-rank__score">
          <strong>{rank.percentage}%</strong>
          <span>{t(`rank.${rank.title}`)}</span>
        </div>
        <p className="prophet-rank__thresholds">{t('profile.thresholds')}</p>
      </section>

      <div className="account-page__stats">
        <div className="account-page__stat"><span>{t('shell.souls')}</span><strong>{player.souls}</strong></div>
        <div className="account-page__stat"><span>{t('profile.wins')}</span><strong>{rank.wins}</strong></div>
        <div className="account-page__stat"><span>{t('profile.settled')}</span><strong>{rank.settled}</strong></div>
        <div className="account-page__stat"><span>{t('profile.open')}</span><strong>{openCount}</strong></div>
      </div>

      <h3>{t('profile.history')}</h3>
      {stakes.length === 0 ? (
        <p className="account-page__empty">{t('profile.empty')}</p>
      ) : (
        <ol className="stake-history">
          {[...stakes].reverse().slice(0, 5).map((stake, index) => (
            <li className="stake-history__item" key={`${stake.pledgeId}-${stake.at}-${index}`}>
              <div>
                <h3>{pledges.find((pledge) => pledge.id === stake.pledgeId)?.question ?? stake.pledgeId}</h3>
                <div className="stake-history__meta">
                  <span>{stake.side === 'KEPT' ? 'TENUE' : 'ROMPUE'} · {stake.amount} Âmes</span>
                  <time dateTime={new Date(stake.at).toISOString()}>{new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(stake.at)}</time>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="account-page__notice">{t('notice.responsible')}</p>
    </section>
  )
}
