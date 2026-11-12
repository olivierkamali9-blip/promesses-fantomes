import { useCallback, useEffect, useReducer } from 'react'
import { demoPledges, type DemoPledge } from '../data/demoPledges'
import { evidenceLevel, resolveOutcome, type ProposedOutcome } from '../engine/evidence'
import { resolvePledge, type FinalState } from '../engine/lifecycle'
import { validateStake } from '../engine/stake'
import { settlePledge, type Side, type Stake } from '../engine/souls'

const STORAGE_KEY = 'promesses-fantomes-demo-game'
const PLAYER_ID = 'demo-player'
const STARTING_SOULS = 1_000
const FICTIONAL_NAMES = [
  'Esprit de Gombe',
  'Ombre de Matonge',
  'Fantôme du Fleuve',
] as const

export type Player = {
  id: typeof PLAYER_ID
  name: 'Vous'
  souls: number
}

export type PlayerStake = Stake & {
  pledgeId: string
}

export type PayoutLine = {
  userId: string
  name: string
  side: Side
  stake: number
  payout: number
  fictional: boolean
}

export type SimulationResult = {
  outcome: FinalState
  settlementKind: 'PAYOUT' | 'REFUND'
  payouts: PayoutLine[]
  playerSouls: number
  unpaidPool: number
}

export type GameState = {
  player: Player
  pledges: DemoPledge[]
  playerStakes: PlayerStake[]
  resolutions: Record<string, SimulationResult>
}

export type GameAction =
  | {
      type: 'STAKE'
      pledgeId: string
      side: Side
      amount: number
      at: number
    }
  | {
      type: 'SIMULATE_RESOLUTION'
      pledgeId: string
      proposedOutcome: ProposedOutcome
    }
  | { type: 'RESET_DEMO' }

function cloneDemoPledges(): DemoPledge[] {
  return demoPledges.map((pledge) => ({
    ...pledge,
    stakes: { ...pledge.stakes },
    sources: pledge.sources.map((source) => ({ ...source })),
  }))
}

export function createInitialGameState(): GameState {
  return {
    player: { id: PLAYER_ID, name: 'Vous', souls: STARTING_SOULS },
    pledges: cloneDemoPledges(),
    playerStakes: [],
    resolutions: {},
  }
}

function splitPool(total: number): number[] {
  const first = Math.floor(total / 2)
  const second = Math.floor((total - first) / 2)
  return [first, second, total - first - second].filter((amount) => amount > 0)
}

export function fictionalStakesFor(
  pledge: DemoPledge,
  playerStakes: readonly Stake[] = [],
): Stake[] {
  const playerPools = playerStakes.reduce<Readonly<Record<Side, number>>>(
    (totals, stake) => ({
      ...totals,
      [stake.side]: totals[stake.side] + stake.amount,
    }),
    { KEPT: 0, BROKEN: 0 },
  )

  return (['KEPT', 'BROKEN'] as const).flatMap((side, sideIndex) =>
    splitPool(Math.max(0, pledge.stakes[side] - playerPools[side])).map(
      (amount, index) => ({
        userId: `fictional-${pledge.id}-${side.toLowerCase()}-${index + 1}`,
        side,
        amount,
        at: sideIndex * 10 + index,
      }),
    ),
  )
}

function fictionalName(index: number): string {
  return FICTIONAL_NAMES[index % FICTIONAL_NAMES.length]
}

function isOpenForStake(pledge: DemoPledge): boolean {
  return pledge.state === 'APPARITION' || pledge.state === 'HAUNTING'
}

function simulateResolution(
  state: GameState,
  pledge: DemoPledge,
  proposedOutcome: ProposedOutcome,
): GameState {
  if (!isOpenForStake(pledge) || state.resolutions[pledge.id]) {
    return state
  }

  const sources = pledge.sources.map(({ url, kind, independentGroup }) => ({
    url,
    kind,
    independentGroup,
  }))
  const level = evidenceLevel(sources)
  const resolution = resolveOutcome(sources, proposedOutcome)
  const requestedOutcome =
    resolution.status === 'RESOLVED' ? resolution.outcome : 'INCONCLUSIVE'
  const outcome = resolvePledge(pledge.state, requestedOutcome, level)
  const playerStakes = state.playerStakes.filter(
    (stake) => stake.pledgeId === pledge.id,
  )
  const fictionalStakes = fictionalStakesFor(pledge, playerStakes)
  const allStakes: Stake[] = [...fictionalStakes, ...playerStakes]
  const settlement = settlePledge(allStakes, outcome)
  const payouts: PayoutLine[] = allStakes.map((stake, index) => ({
    userId: stake.userId,
    name:
      stake.userId === PLAYER_ID
        ? state.player.name
        : fictionalName(index),
    side: stake.side,
    stake: stake.amount,
    payout: settlement.payouts[index],
    fictional: stake.userId !== PLAYER_ID,
  }))
  const playerPayout = payouts
    .filter((payout) => !payout.fictional)
    .reduce((total, payout) => total + payout.payout, 0)
  const playerSouls = state.player.souls + playerPayout

  return {
    ...state,
    player: { ...state.player, souls: playerSouls },
    pledges: state.pledges.map((candidate) =>
      candidate.id === pledge.id ? { ...candidate, state: outcome } : candidate,
    ),
    resolutions: {
      ...state.resolutions,
      [pledge.id]: {
        outcome,
        settlementKind: settlement.kind,
        payouts,
        playerSouls,
        unpaidPool: 0,
      },
    },
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (action.type === 'RESET_DEMO') {
    return createInitialGameState()
  }

  const pledge = state.pledges.find(
    (candidate) => candidate.id === action.pledgeId,
  )

  if (!pledge) {
    return state
  }

  if (action.type === 'SIMULATE_RESOLUTION') {
    return simulateResolution(state, pledge, action.proposedOutcome)
  }

  if (
    !isOpenForStake(pledge) ||
    state.resolutions[pledge.id] ||
    !validateStake(state.player.souls, action.amount).ok
  ) {
    return state
  }

  return {
    ...state,
    player: {
      ...state.player,
      souls: state.player.souls - action.amount,
    },
    pledges: state.pledges.map((candidate) =>
      candidate.id === pledge.id
        ? {
            ...candidate,
            stakes: {
              ...candidate.stakes,
              [action.side]: candidate.stakes[action.side] + action.amount,
            },
          }
        : candidate,
    ),
    playerStakes: [
      ...state.playerStakes,
      {
        pledgeId: pledge.id,
        userId: state.player.id,
        side: action.side,
        amount: action.amount,
        at: action.at,
      },
    ],
  }
}

function isStoredGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<GameState>
  return (
    typeof candidate.player?.souls === 'number' &&
    Array.isArray(candidate.pledges) &&
    Array.isArray(candidate.playerStakes) &&
    Boolean(candidate.resolutions) &&
    typeof candidate.resolutions === 'object'
  )
}

function loadGameState(): GameState {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)

    if (!stored) {
      return createInitialGameState()
    }

    const parsed: unknown = JSON.parse(stored)
    return isStoredGameState(parsed) ? parsed : createInitialGameState()
  } catch {
    return createInitialGameState()
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadGameState)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // The demo remains usable when storage is unavailable or full.
    }
  }, [state])

  const stake = useCallback((pledgeId: string, side: Side, amount: number) => {
    dispatch({ type: 'STAKE', pledgeId, side, amount, at: Date.now() })
  }, [])

  const simulateResolution = useCallback(
    (pledgeId: string, proposedOutcome: ProposedOutcome) => {
      dispatch({
        type: 'SIMULATE_RESOLUTION',
        pledgeId,
        proposedOutcome,
      })
    },
    [],
  )

  const resetDemo = useCallback(() => {
    dispatch({ type: 'RESET_DEMO' })
  }, [])

  return { state, stake, simulateResolution, resetDemo }
}
