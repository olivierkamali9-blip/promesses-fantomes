import { useCallback, useEffect, useReducer, useState } from 'react'
import { decide, type GuardianDecision } from '../ai/guardian'
import { FixtureLlm } from '../ai/llm'
import { validatePublishable } from '../ai/publishable'
import { draftPledge } from '../ai/drafter'
import { scout } from '../ai/scout'
import type { Candidate, Draft } from '../ai/types'
import { demoPledges, type DemoPledge } from '../data/demoPledges'
import { evidenceLevel, resolveOutcome, type ProposedOutcome } from '../engine/evidence'
import { applyEvent, resolvePledge, type FinalState } from '../engine/lifecycle'
import { mergeTier, type SafetyTier } from '../engine/safety'
import { validateStake } from '../engine/stake'
import { settlePledge, type Side, type Stake } from '../engine/souls'
import { FixtureAdapter } from '../sources/adapter'

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

export type DraftQueueItem = {
  id: string
  candidate: Candidate
  draft: Draft
  decision: GuardianDecision
  createdAt: number
}

export type DecisionAction =
  | 'GENERATE_DRAFTS'
  | 'APPROVE_DRAFT'
  | 'EDIT_DRAFT'
  | 'REJECT_DRAFT'

export type DecisionSubject = {
  draftId: string
  question: string
  tier: SafetyTier
  decision: GuardianDecision['action'] | 'REFUSED'
  reason: string
}

export type DecisionLogEntry = {
  id: string
  actor: 'ai' | 'human'
  action: DecisionAction
  reason: string
  time: number
  subjects: DecisionSubject[]
}

export type GameState = {
  player: Player
  pledges: DemoPledge[]
  playerStakes: PlayerStake[]
  resolutions: Record<string, SimulationResult>
  draftsQueue: DraftQueueItem[]
  decisionsLog: DecisionLogEntry[]
}

export type DraftEdits = Pick<Draft, 'question' | 'criteria' | 'deadline'>

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
  | {
      type: 'GENERATE_DRAFTS'
      drafts: DraftQueueItem[]
      at: number
      error?: string
    }
  | { type: 'APPROVE_DRAFT'; draftId: string; at: number }
  | {
      type: 'EDIT_DRAFT'
      draftId: string
      edits: DraftEdits
      at: number
    }
  | { type: 'REJECT_DRAFT'; draftId: string; reason: string; at: number }
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
    draftsQueue: [],
    decisionsLog: [],
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

function stableDraftId(sourceUrl: string): string {
  let hash = 2166136261
  for (const character of sourceUrl) {
    hash ^= character.codePointAt(0) ?? 0
    hash = Math.imul(hash, 16777619)
  }
  return `draft-${(hash >>> 0).toString(36)}`
}

export async function generateFixtureDrafts(): Promise<DraftQueueItem[]> {
  const candidates = await scout(new FixtureAdapter(), '')
  const llm = new FixtureLlm()

  return Promise.all(
    candidates.map(async (candidate) => {
      const draft = await draftPledge(llm, candidate)
      return {
        id: stableDraftId(candidate.sourceUrl),
        candidate,
        draft,
        decision: decide(draft),
        createdAt: Date.now(),
      }
    }),
  )
}

function draftToPledge(item: DraftQueueItem): DemoPledge | null {
  const decision = decide(item.draft)
  if (decision.action === 'REJECT' || decision.tier === 'BLOCKED') {
    return null
  }

  return {
    id: item.id,
    question: item.draft.question,
    criteria: item.draft.criteria,
    deadline: item.draft.deadline,
    state: applyEvent('MURMUR', { type: 'APPROVE' }),
    evidenceLevel: evidenceLevel(item.draft.sources),
    tier: decision.tier,
    unconfirmed: decision.tier === 'ORANGE',
    stakes: { KEPT: 0, BROKEN: 0 },
    sources: item.draft.sources.map((source, index) => ({
      ...source,
      label: `Source fictive ${index + 1}`,
    })),
  }
}

function decisionSubject(item: DraftQueueItem): DecisionSubject {
  return {
    draftId: item.id,
    question: item.draft.question,
    tier: item.decision.tier,
    decision: item.decision.action,
    reason: item.decision.reason,
  }
}

function appendDecision(
  state: GameState,
  actor: DecisionLogEntry['actor'],
  action: DecisionAction,
  reason: string,
  time: number,
  subjects: DecisionSubject[],
): GameState {
  return {
    ...state,
    decisionsLog: [
      ...state.decisionsLog,
      {
        id: `decision-${time}-${state.decisionsLog.length}`,
        actor,
        action,
        reason,
        time,
        subjects,
      },
    ],
  }
}

function handleGeneratedDrafts(
  state: GameState,
  action: Extract<GameAction, { type: 'GENERATE_DRAFTS' }>,
): GameState {
  const reviewed = action.drafts.map((item) => ({
    ...item,
    decision: decide(item.draft),
  }))
  const existingQueueIds = new Set(state.draftsQueue.map((item) => item.id))
  const existingPledgeIds = new Set(state.pledges.map((pledge) => pledge.id))
  const waiting = reviewed.filter(
    (item) =>
      item.decision.action === 'QUEUE_APPROVAL' &&
      item.decision.tier !== 'BLOCKED' &&
      !existingQueueIds.has(item.id) &&
      !existingPledgeIds.has(item.id),
  )
  const published = reviewed
    .filter(
      (item) =>
        item.decision.action === 'PUBLISH' &&
        item.decision.tier !== 'BLOCKED' &&
        !existingPledgeIds.has(item.id),
    )
    .map(draftToPledge)
    .filter((pledge): pledge is DemoPledge => pledge !== null)
  const reason = action.error?.trim()
    ? `Génération interrompue : ${action.error.trim()}`
    : `${reviewed.length} brouillon(s) classé(s) par le Gardien.`

  return appendDecision(
    {
      ...state,
      draftsQueue: [...state.draftsQueue, ...waiting],
      pledges: [...published, ...state.pledges],
    },
    'ai',
    action.type,
    reason,
    action.at,
    reviewed.map(decisionSubject),
  )
}

function refusedSubject(
  draftId: string,
  reason: string,
  item?: DraftQueueItem,
): DecisionSubject {
  return {
    draftId,
    question: item?.draft.question ?? 'Brouillon introuvable',
    tier: item?.decision.tier ?? 'BLOCKED',
    decision: 'REFUSED',
    reason,
  }
}

function handleApproval(
  state: GameState,
  action: Extract<GameAction, { type: 'APPROVE_DRAFT' }>,
): GameState {
  const item = state.draftsQueue.find((draft) => draft.id === action.draftId)
  if (!item) {
    return state
  }

  const refusedReason =
    item.decision.tier === 'BLOCKED'
      ? `Approbation refusée : ${item.decision.reason}`
      : item.decision.action !== 'QUEUE_APPROVAL'
        ? `Approbation refusée : ${item.decision.reason}`
        : null

  if (refusedReason) {
    return appendDecision(
      state,
      'human',
      action.type,
      refusedReason,
      action.at,
      [refusedSubject(action.draftId, refusedReason, item)],
    )
  }

  const pledge = draftToPledge(item)
  if (!pledge) {
    const reason = `Approbation refusée : ${item.decision.reason}`
    return appendDecision(state, 'human', action.type, reason, action.at, [
      refusedSubject(action.draftId, reason, item),
    ])
  }

  const nextState: GameState = {
    ...state,
    draftsQueue: state.draftsQueue.filter((draft) => draft.id !== item.id),
    pledges: state.pledges.some((candidate) => candidate.id === pledge.id)
      ? state.pledges
      : [pledge, ...state.pledges],
  }
  const reason = 'Le brouillon a été approuvé et publié comme APPARITION.'

  return appendDecision(nextState, 'human', action.type, reason, action.at, [
    { ...decisionSubject(item), decision: 'PUBLISH', reason },
  ])
}

function handleEdit(
  state: GameState,
  action: Extract<GameAction, { type: 'EDIT_DRAFT' }>,
): GameState {
  const item = state.draftsQueue.find((draft) => draft.id === action.draftId)
  if (!item) {
    return state
  }

  const editedDraft: Draft = {
    ...item.draft,
    ...action.edits,
    modelTier: mergeTier(item.decision.tier, item.draft.modelTier),
  }
  const publishable = validatePublishable(editedDraft)
  const guardianDecision = decide(editedDraft)
  const updated: DraftQueueItem = {
    ...item,
    draft: editedDraft,
    decision: {
      ...guardianDecision,
      reason: publishable.ok
        ? guardianDecision.reason
        : publishable.reasons.join(' '),
    },
  }
  const nextQueue =
    updated.decision.tier === 'BLOCKED'
      ? state.draftsQueue.filter((draft) => draft.id !== item.id)
      : state.draftsQueue.map((draft) =>
          draft.id === item.id ? updated : draft,
        )
  const reason =
    updated.decision.tier === 'BLOCKED'
      ? `Le brouillon modifié est bloqué : ${updated.decision.reason}`
      : `Le brouillon modifié reste classé ${updated.decision.tier}. ${updated.decision.reason}`

  return appendDecision(
    { ...state, draftsQueue: nextQueue },
    'human',
    action.type,
    reason,
    action.at,
    [decisionSubject(updated)],
  )
}

function handleRejection(
  state: GameState,
  action: Extract<GameAction, { type: 'REJECT_DRAFT' }>,
): GameState {
  const item = state.draftsQueue.find((draft) => draft.id === action.draftId)
  if (!item) {
    return state
  }

  const humanReason = action.reason.trim()
  if (humanReason.length === 0) {
    const reason = 'Rejet refusé : une raison humaine est requise.'
    return appendDecision(state, 'human', action.type, reason, action.at, [
      refusedSubject(action.draftId, reason, item),
    ])
  }

  const reason = `Brouillon rejeté par une personne : ${humanReason}`
  return appendDecision(
    {
      ...state,
      draftsQueue: state.draftsQueue.filter((draft) => draft.id !== item.id),
    },
    'human',
    action.type,
    reason,
    action.at,
    [{ ...decisionSubject(item), decision: 'REJECT', reason }],
  )
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (action.type === 'RESET_DEMO') {
    return createInitialGameState()
  }

  if (action.type === 'GENERATE_DRAFTS') {
    return handleGeneratedDrafts(state, action)
  }
  if (action.type === 'APPROVE_DRAFT') {
    return handleApproval(state, action)
  }
  if (action.type === 'EDIT_DRAFT') {
    return handleEdit(state, action)
  }
  if (action.type === 'REJECT_DRAFT') {
    return handleRejection(state, action)
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

function isStoredGameState(value: unknown): value is Omit<GameState, 'draftsQueue' | 'decisionsLog'> &
  Partial<Pick<GameState, 'draftsQueue' | 'decisionsLog'>> {
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
    if (!isStoredGameState(parsed)) {
      return createInitialGameState()
    }

    return {
      ...parsed,
      draftsQueue: Array.isArray(parsed.draftsQueue) ? parsed.draftsQueue : [],
      decisionsLog: Array.isArray(parsed.decisionsLog) ? parsed.decisionsLog : [],
    }
  } catch {
    return createInitialGameState()
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadGameState)
  const [isGeneratingDrafts, setIsGeneratingDrafts] = useState(false)

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

  const generateDrafts = useCallback(async () => {
    if (isGeneratingDrafts) {
      return
    }

    setIsGeneratingDrafts(true)
    try {
      const drafts = await generateFixtureDrafts()
      dispatch({ type: 'GENERATE_DRAFTS', drafts, at: Date.now() })
    } catch (error) {
      dispatch({
        type: 'GENERATE_DRAFTS',
        drafts: [],
        at: Date.now(),
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      })
    } finally {
      setIsGeneratingDrafts(false)
    }
  }, [isGeneratingDrafts])

  const approveDraft = useCallback((draftId: string) => {
    dispatch({ type: 'APPROVE_DRAFT', draftId, at: Date.now() })
  }, [])

  const editDraft = useCallback((draftId: string, edits: DraftEdits) => {
    dispatch({ type: 'EDIT_DRAFT', draftId, edits, at: Date.now() })
  }, [])

  const rejectDraft = useCallback((draftId: string, reason: string) => {
    dispatch({ type: 'REJECT_DRAFT', draftId, reason, at: Date.now() })
  }, [])

  const resetDemo = useCallback(() => {
    dispatch({ type: 'RESET_DEMO' })
  }, [])

  return {
    state,
    isGeneratingDrafts,
    stake,
    simulateResolution,
    generateDrafts,
    approveDraft,
    editDraft,
    rejectDraft,
    resetDemo,
  }
}
