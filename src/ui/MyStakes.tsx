import type { Locale, TranslationKey } from '../i18n'
import { translate } from '../i18n'
import type { DemoPledge } from '../data/demoPledges'
import type { PlayerStake, SimulationResult } from '../state/useGame'
import './accountPages.css'

type MyStakesProps = {
  stakes: readonly PlayerStake[]
  pledges: readonly DemoPledge[]
  resolutions: Readonly<Record<string, SimulationResult>>
  locale: Locale
}

function payoutForStake(
  stake: PlayerStake,
  allStakes: readonly PlayerStake[],
  result?: SimulationResult,
): number {
  if (!result) return 0
  const pledgeStakes = allStakes.filter((item) => item.pledgeId === stake.pledgeId)
  const stakeIndex = pledgeStakes.indexOf(stake)
  const playerPayouts = result.payouts.filter((payout) => !payout.fictional)
  return playerPayouts[stakeIndex]?.payout ?? 0
}

export function MyStakes({ stakes, pledges, resolutions, locale }: MyStakesProps) {
  const t = (key: TranslationKey) => translate(locale, key)
  const total = stakes.reduce((sum, stake) => sum + stake.amount, 0)
  const returned = stakes.reduce(
    (sum, stake) => sum + payoutForStake(
      stake,
      stakes,
      resolutions[stake.pledgeId],
    ),
    0,
  )

  function statusFor(stake: PlayerStake): string {
    const result = resolutions[stake.pledgeId]
    if (!result) return t('stakes.open')
    if (result.outcome === 'INCONCLUSIVE') return t('stakes.refunded')
    if (result.outcome !== stake.side) return t('stakes.lost')
    const profit = Math.max(
      0,
      payoutForStake(stake, stakes, result) - stake.amount,
    )
    return `${t('stakes.won')} +${profit}`
  }

  return (
    <section className="account-page" aria-labelledby="my-stakes-title">
      <div className="account-page__heading">
        <div>
          <p className="account-page__eyebrow">Carnet spectral</p>
          <h2 id="my-stakes-title">{t('stakes.title')}</h2>
        </div>
      </div>
      <div className="account-page__stats">
        <div className="account-page__stat"><span>{t('stakes.total')}</span><strong>{total}</strong></div>
        <div className="account-page__stat"><span>{t('stakes.returned')}</span><strong>{returned}</strong></div>
      </div>
      <p className="account-page__notice">{t('notice.noMoney')}</p>
      {stakes.length === 0 ? (
        <p className="account-page__empty">{t('stakes.empty')}</p>
      ) : (
        <ol className="stake-history">
          {[...stakes].reverse().map((stake, index) => {
            const pledge = pledges.find((item) => item.id === stake.pledgeId)
            return (
              <li className="stake-history__item" key={`${stake.pledgeId}-${stake.at}-${index}`}>
                <div>
                  <h3>{pledge?.question ?? stake.pledgeId}</h3>
                  <div className="stake-history__meta">
                    <span>{stake.side === 'KEPT' ? 'TENUE' : 'ROMPUE'} · {stake.amount} Âmes</span>
                    <time dateTime={new Date(stake.at).toISOString()}>{new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(stake.at)}</time>
                  </div>
                </div>
                <strong className="stake-history__status">{statusFor(stake)}</strong>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
