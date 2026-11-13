import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { decideResolution, type ConsensusDecision } from '../ai/consensus'
import { decide, type GuardianDecision } from '../ai/guardian'
import { FixtureLlm } from '../ai/llm'
import { validatePublishable } from '../ai/publishable'
import { draftPledge } from '../ai/drafter'
import { scout } from '../ai/scout'
import type { Candidate, Draft } from '../ai/types'
import { runVerifiers, type VerifierCheck } from '../ai/verifier'
import { demoPledges, type DemoPledge } from '../data/demoPledges'
import { evidenceLevel, resolveOutcome, type ProposedOutcome } from '../engine/evidence'
import { applyEvent, resolvePledge, type FinalState } from '../engine/lifecycle'
import { mergeTier, type SafetyTier } from '../engine/safety'
import {
  DEFAULT_DAILY_STAKE_CAP,
  isStakeWindowOpen,
  totalStakedOnDay,
  validateStake,
} from '../engine/stake'
import { settlePledge, type Side, type Stake } from '../engine/souls'
import {
  draftLiveFootball,
  isLiveFootballCandidate,
  type LiveFootballCandidate,
} from '../sources/footballLive'
import {
  draftPoliticalStatement,
  isPoliticalCandidate,
  type PoliticalCandidate,
} from '../sources/politicalLive'
import {
  createAdapter,
  FixtureAdapter,
  type AdapterMode,
  type ModeAwareSourceAdapter,
} from '../sources'

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
  resolvedBy: 'ai' | 'human'
  reason: string
}

export type Tombstone = {
  pledgeId: string
  aiClaim: FinalState
  humanOutcome: FinalState
  reason: string
  date: string
}

export type DraftQueueItem = {
  id: string
  candidate: Candidate
  draft: Draft
  decision: GuardianDecision
  createdAt: number
  sourceMode?: AdapterMode
}

export type DecisionAction =
  | 'GENERATE_DRAFTS'
  | 'APPROVE_DRAFT'
  | 'EDIT_DRAFT'
  | 'REJECT_DRAFT'
  | 'RUN_VERIFIERS'
  | 'HUMAN_RESOLVE'
  | 'HUMAN_OVERRIDE'

export type DecisionSubject = {
  draftId: string
  question: string
  tier: SafetyTier
  decision: GuardianDecision['action'] | 'REFUSED' | FinalState
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
  tombstones: Tombstone[]
  sourceRefreshAt: number | null
}

export type DraftEdits = Pick<Draft, 'question' | 'criteria' | 'deadline'>

export type GameAction =
  | {
      type: 'STAKE'
      pledgeId: string
      side: Side
      amount: number
      at: number
      dailyStakeCap?: number
    }
  | {
      type: 'SIMULATE_RESOLUTION'
      pledgeId: string
      proposedOutcome: ProposedOutcome
    }
  | {
      type: 'RUN_VERIFIERS'
      pledgeId: string
      checks: VerifierCheck[]
      at: number
    }
  | {
      type: 'HUMAN_RESOLVE'
      pledgeId: string
      outcome: FinalState
      reason: string
      at: number
    }
  | {
      type: 'HUMAN_OVERRIDE'
      pledgeId: string
      outcome: FinalState
      reason: string
      at: number
    }
  | {
      type: 'GENERATE_DRAFTS'
      drafts: DraftQueueItem[]
      replays?: DemoPledge[]
      refreshedAt?: number
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
    verification: pledge.verification
      ? {
          ...pledge.verification,
          checks: pledge.verification.checks.map((check) => ({
            ...check,
            reasons: [...check.reasons],
          })),
        }
      : undefined,
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
    tombstones: [],
    sourceRefreshAt: Date.now(),
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

function isUnresolvedPledge(pledge: DemoPledge): boolean {
  return pledge.state === 'APPARITION' || pledge.state === 'HAUNTING'
}

function isOpenForStake(pledge: DemoPledge, at = Date.now()): boolean {
  return isStakeWindowOpen(pledge.state, pledge.deadline, at)
}

function sourcesFor(pledge: DemoPledge) {
  return pledge.sources.map(({ url, kind, independentGroup }) => ({
    url,
    kind,
    independentGroup,
  }))
}

function settlementFor(
  state: GameState,
  pledge: DemoPledge,
  outcome: FinalState,
): Pick<SimulationResult, 'settlementKind' | 'payouts'> {
  const playerStakes = state.playerStakes.filter(
    (stake) => stake.pledgeId === pledge.id,
  )
  const fictionalStakes = fictionalStakesFor(pledge, playerStakes)
  const allStakes: Stake[] = [...fictionalStakes, ...playerStakes]
  const settlement = settlePledge(allStakes, outcome)
  const payouts: PayoutLine[] = allStakes.map((stake, index) => ({
    userId: stake.userId,
    name:
      stake.userId === PLAYER_ID ? state.player.name : fictionalName(index),
    side: stake.side,
    stake: stake.amount,
    payout: settlement.payouts[index],
    fictional: stake.userId !== PLAYER_ID,
  }))

  return { settlementKind: settlement.kind, payouts }
}

function playerPayout(payouts: readonly PayoutLine[]): number {
  return payouts
    .filter((payout) => !payout.fictional)
    .reduce((total, payout) => total + payout.payout, 0)
}

function settleResolution(
  state: GameState,
  pledge: DemoPledge,
  requestedOutcome: FinalState,
  resolvedBy: SimulationResult['resolvedBy'],
  reason: string,
): GameState {
  if (!isUnresolvedPledge(pledge) || state.resolutions[pledge.id]) {
    return state
  }

  const level = evidenceLevel(sourcesFor(pledge))
  const outcome = resolvePledge(pledge.state, requestedOutcome, level)
  const settlement = settlementFor(state, pledge, outcome)
  const playerSouls = state.player.souls + playerPayout(settlement.payouts)

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
        ...settlement,
        playerSouls,
        unpaidPool: 0,
        resolvedBy,
        reason,
      },
    },
  }
}

function simulateResolution(
  state: GameState,
  pledge: DemoPledge,
  proposedOutcome: ProposedOutcome,
): GameState {
  const resolution = resolveOutcome(sourcesFor(pledge), proposedOutcome)
  const requestedOutcome =
    resolution.status === 'RESOLVED' ? resolution.outcome : 'INCONCLUSIVE'

  return settleResolution(
    state,
    pledge,
    requestedOutcome,
    'ai',
    'Résolution de démonstration historique.',
  )
}

function pledgeDecisionSubject(
  pledge: DemoPledge,
  decision: FinalState,
  reason: string,
): DecisionSubject {
  return {
    draftId: pledge.id,
    question: pledge.question,
    tier: pledge.tier,
    decision,
    reason,
  }
}

function handleVerifierChecks(
  state: GameState,
  pledge: DemoPledge,
  checks: VerifierCheck[],
  at: number,
): GameState {
  if (!isUnresolvedPledge(pledge) || state.resolutions[pledge.id]) {
    return state
  }

  const level = evidenceLevel(sourcesFor(pledge))
  const decision: ConsensusDecision = decideResolution(checks, level, pledge.tier)
  const checkedState: GameState = {
    ...state,
    pledges: state.pledges.map((candidate) =>
      candidate.id === pledge.id
        ? {
            ...candidate,
            evidenceLevel: level,
            verification: {
              checks: checks.map((check) => ({
                ...check,
                reasons: [...check.reasons],
              })),
              decision,
              checkedAt: at,
            },
          }
        : candidate,
    ),
  }
  const loggedState = appendDecision(
    checkedState,
    'ai',
    'RUN_VERIFIERS',
    decision.reason,
    at,
    [pledgeDecisionSubject(pledge, decision.outcome, decision.reason)],
  )

  if (decision.action !== 'AUTO_RESOLVE') {
    return loggedState
  }

  const checkedPledge = loggedState.pledges.find(
    (candidate) => candidate.id === pledge.id,
  )
  return checkedPledge
    ? settleResolution(
        loggedState,
        checkedPledge,
        decision.outcome,
        'ai',
        decision.reason,
      )
    : loggedState
}

function handleHumanResolution(
  state: GameState,
  pledge: DemoPledge,
  outcome: FinalState,
  reason: string,
  at: number,
): GameState {
  const humanReason = reason.trim()
  if (
    humanReason.length === 0 ||
    pledge.verification?.decision.action !== 'HUMAN_REVIEW' ||
    state.resolutions[pledge.id]
  ) {
    return state
  }

  const resolved = settleResolution(
    state,
    pledge,
    outcome,
    'human',
    humanReason,
  )
  if (resolved === state) {
    return state
  }

  const finalOutcome = resolved.resolutions[pledge.id].outcome
  return appendDecision(
    resolved,
    'human',
    'HUMAN_RESOLVE',
    humanReason,
    at,
    [pledgeDecisionSubject(pledge, finalOutcome, humanReason)],
  )
}

function handleHumanOverride(
  state: GameState,
  pledge: DemoPledge,
  outcome: FinalState,
  reason: string,
  at: number,
): GameState {
  const previous = state.resolutions[pledge.id]
  const humanReason = reason.trim()
  const level = evidenceLevel(sourcesFor(pledge))
  const permittedOutcome =
    (outcome === 'KEPT' || outcome === 'BROKEN') && level < 3
      ? 'INCONCLUSIVE'
      : outcome
  if (
    !previous ||
    previous.resolvedBy !== 'ai' ||
    previous.outcome === permittedOutcome ||
    humanReason.length === 0
  ) {
    return state
  }

  const override = applyEvent(pledge.state, {
    type: 'OVERRIDE',
    outcome: permittedOutcome,
  })
  const settlement = settlementFor(state, pledge, override.state)
  const soulsBeforeInitialSettlement =
    state.player.souls - playerPayout(previous.payouts)
  const playerSouls =
    soulsBeforeInitialSettlement + playerPayout(settlement.payouts)
  const tombstone: Tombstone = {
    pledgeId: pledge.id,
    aiClaim: previous.outcome,
    humanOutcome: override.state,
    reason: humanReason,
    date: new Date(at).toISOString(),
  }
  const overridden: GameState = {
    ...state,
    player: { ...state.player, souls: playerSouls },
    pledges: state.pledges.map((candidate) =>
      candidate.id === pledge.id
        ? { ...candidate, state: override.state }
        : candidate,
    ),
    resolutions: {
      ...state.resolutions,
      [pledge.id]: {
        outcome: override.state,
        ...settlement,
        playerSouls,
        unpaidPool: 0,
        resolvedBy: 'human',
        reason: humanReason,
      },
    },
    tombstones: [...state.tombstones, tombstone],
  }

  return appendDecision(
    overridden,
    'human',
    'HUMAN_OVERRIDE',
    humanReason,
    at,
    [pledgeDecisionSubject(pledge, override.state, humanReason)],
  )
}

function stableDraftId(sourceUrl: string): string {
  let hash = 2166136261
  for (const character of sourceUrl) {
    hash ^= character.codePointAt(0) ?? 0
    hash = Math.imul(hash, 16777619)
  }
  return `draft-${(hash >>> 0).toString(36)}`
}

export type GeneratedSourceImport = {
  drafts: DraftQueueItem[]
  replays: DemoPledge[]
}

async function draftRealMatch(candidate: LiveFootballCandidate): Promise<Draft> {
  const template = draftLiveFootball(candidate)
  return draftPledge(
    { complete: () => Promise.resolve(JSON.stringify(template)) },
    candidate,
  )
}

async function draftPoliticalCandidate(
  candidate: PoliticalCandidate,
): Promise<Draft> {
  const template = draftPoliticalStatement(candidate)
  return draftPledge(
    { complete: () => Promise.resolve(JSON.stringify(template)) },
    candidate,
  )
}

export async function generateSourceImport(
  adapter: ModeAwareSourceAdapter,
): Promise<GeneratedSourceImport> {
  const candidates = await scout(adapter, '')
  const llm = new FixtureLlm()
  const createdAt = Date.now()
  const replays = candidates
    .filter(isLiveFootballCandidate)
    .filter((candidate) => candidate.phase === 'REPLAY')
    .slice(0, 3)
    .map(replayCandidateToPledge)
    .filter((pledge): pledge is DemoPledge => pledge !== null)
  const regularCandidates = candidates.filter(
    (candidate) =>
      !isLiveFootballCandidate(candidate) && !isPoliticalCandidate(candidate),
  )
  const politicalCandidates = candidates
    .filter(isPoliticalCandidate)
    .slice(0, 8)
  const upcomingCandidates = candidates
    .filter(isLiveFootballCandidate)
    .filter((candidate) => candidate.phase === 'UPCOMING')
    .slice(0, 6)
  const draftCandidates = [
    ...regularCandidates,
    ...upcomingCandidates,
    ...politicalCandidates,
  ]
  const items = await Promise.all(
    draftCandidates.map(async (candidate) => {
      const football = isLiveFootballCandidate(candidate)
      const political = isPoliticalCandidate(candidate)
      const draft = football
        ? await draftRealMatch(candidate)
        : political
          ? await draftPoliticalCandidate(candidate)
          : await draftPledge(llm, candidate)
      const decision = decide(draft)
      const real = football || political

      return {
        id: stableDraftId(
          political
            ? `${candidate.sourceUrl}|${candidate.exactStatement}`
            : football
              ? `${candidate.title}|${candidate.publishedAt}|${candidate.sourceUrl}`
              : candidate.sourceUrl,
        ),
        candidate,
        draft,
        decision,
        createdAt,
        sourceMode: real ? 'live' as const : 'demo' as const,
      }
    }),
  )

  return {
    drafts: items.filter((item) => {
      if (isLiveFootballCandidate(item.candidate)) {
        return item.decision.action === 'PUBLISH' && item.decision.tier === 'GREEN'
      }
      if (isPoliticalCandidate(item.candidate)) {
        return true
      }
      return true
    }),
    replays,
  }
}

export async function generateDraftsFromAdapter(
  adapter: ModeAwareSourceAdapter,
): Promise<DraftQueueItem[]> {
  return (await generateSourceImport(adapter)).drafts
}

export function generateFixtureDrafts(): Promise<DraftQueueItem[]> {
  return generateDraftsFromAdapter(new FixtureAdapter())
}

function sourceLabel(item: DraftQueueItem, independentGroup: string, index: number): string {
  if (item.sourceMode !== 'live') {
    return `Source fictive ${index + 1}`
  }
  if (independentGroup === 'football-data') {
    return 'football-data.org'
  }
  if (independentGroup === 'openfootball') {
    return 'openfootball'
  }
  if (independentGroup === 'presidence-rdc') {
    return 'Présidence RDC'
  }
  if (independentGroup === 'gouvernement-rdc') {
    return 'Communication du Gouvernement RDC'
  }
  if (independentGroup === 'radio-okapi') {
    return 'Radio Okapi'
  }
  return `Source en direct ${index + 1}`
}

function replaySourceLabel(independentGroup: string, index: number): string {
  if (independentGroup === 'football-data') return 'football-data.org'
  if (independentGroup === 'openfootball') return 'openfootball'
  return `Source en direct ${index + 1}`
}

export function replayCandidateToPledge(
  candidate: LiveFootballCandidate,
): DemoPledge | null {
  const match = candidate.matches.find(
    (item) => item.status === 'FINISHED' && item.scoreFt !== null,
  )
  const level = evidenceLevel(candidate.evidenceSources)
  if (candidate.phase !== 'REPLAY' || candidate.conflict || !match?.scoreFt || level < 3) {
    return null
  }

  const outcome: FinalState = match.scoreFt[0] > match.scoreFt[1]
    ? 'KEPT'
    : 'BROKEN'
  const label = "Rediffusion d'un vrai résultat (saison 2025-26)"

  return {
    id: stableDraftId(`replay|${candidate.title}|${candidate.publishedAt}`)
      .replace('draft-', 'replay-'),
    category: 'SPORT',
    question: `${match.home} gagnera-t-il contre ${match.away} ?`,
    criteria: `Le score après 90 minutes doit donner plus de buts à ${match.home} qu’à ${match.away}.`,
    deadline: new Date(Date.parse(match.kickoffUtc) + 2 * 60 * 60 * 1_000)
      .toISOString(),
    state: outcome,
    evidenceLevel: level,
    tier: 'GREEN',
    liveSource: true,
    liveKind: 'REPLAY',
    realMatchLabel: label,
    stakes: { KEPT: 0, BROKEN: 0 },
    sources: candidate.evidenceSources.map((source, index) => ({
      ...source,
      label: replaySourceLabel(source.independentGroup, index),
    })),
  }
}

function draftToPledge(item: DraftQueueItem): DemoPledge | null {
  const decision = decide(item.draft)
  const political = isPoliticalCandidate(item.candidate)
  if (decision.action === 'REJECT' || decision.tier === 'BLOCKED') {
    return null
  }

  return {
    id: item.id,
    category: political
      ? 'POLITICS'
      : item.sourceMode === 'live' ? 'SPORT' : 'WORLD',
    question: item.draft.question,
    criteria: item.draft.criteria,
    deadline: item.draft.deadline,
    state: applyEvent('MURMUR', { type: 'APPROVE' }),
    evidenceLevel: evidenceLevel(item.draft.sources),
    tier: decision.tier,
    liveSource: item.sourceMode === 'live',
    liveKind: item.sourceMode === 'live' && !political ? 'UPCOMING' : undefined,
    realMatchLabel: item.sourceMode === 'live'
      ? political ? 'Déclaration réelle' : 'Match réel'
      : undefined,
    publicStatement: political ? item.candidate.exactStatement : undefined,
    speaker: political ? item.candidate.speaker : undefined,
    unconfirmed: decision.tier === 'ORANGE',
    stakes: { KEPT: 0, BROKEN: 0 },
    sources: item.draft.sources.map((source, index) => ({
      ...source,
      label: sourceLabel(item, source.independentGroup, index),
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
      (item.sourceMode !== 'live' || isPoliticalCandidate(item.candidate)) &&
      !existingQueueIds.has(item.id) &&
      !existingPledgeIds.has(item.id),
  )
  const published = reviewed
    .filter(
      (item) =>
        item.decision.action === 'PUBLISH' &&
        item.decision.tier !== 'BLOCKED' &&
        (
          item.sourceMode !== 'live' ||
          (isLiveFootballCandidate(item.candidate) && item.decision.tier === 'GREEN') ||
          (isPoliticalCandidate(item.candidate) && item.decision.tier === 'ORANGE')
        ) &&
        !existingPledgeIds.has(item.id),
    )
    .map(draftToPledge)
    .filter((pledge): pledge is DemoPledge => pledge !== null)
  const importedReplays = (action.replays ?? []).filter((pledge) =>
    pledge.liveKind === 'REPLAY' &&
    pledge.tier === 'GREEN' &&
    pledge.evidenceLevel >= 3 &&
    (pledge.state === 'KEPT' || pledge.state === 'BROKEN') &&
    !existingPledgeIds.has(pledge.id),
  )
  const replayResolutions = Object.fromEntries(
    importedReplays.map((pledge) => [
      pledge.id,
      {
        outcome: pledge.state as FinalState,
        settlementKind: 'PAYOUT' as const,
        payouts: [],
        playerSouls: state.player.souls,
        unpaidPool: 0,
        resolvedBy: 'ai' as const,
        reason: pledge.realMatchLabel ?? 'Résultat réel confirmé.',
      },
    ]),
  )
  const reason = action.error?.trim()
    ? `Génération interrompue : ${action.error.trim()}`
    : `${reviewed.length} brouillon(s) classé(s) par le Gardien et ${importedReplays.length} rediffusion(s) confirmée(s).`

  return appendDecision(
    {
      ...state,
      draftsQueue: [...state.draftsQueue, ...waiting],
      pledges: [...published, ...importedReplays, ...state.pledges],
      resolutions: { ...state.resolutions, ...replayResolutions },
      sourceRefreshAt: action.refreshedAt ?? state.sourceRefreshAt,
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
  if (action.type === 'RUN_VERIFIERS') {
    return handleVerifierChecks(state, pledge, action.checks, action.at)
  }
  if (action.type === 'HUMAN_RESOLVE') {
    return handleHumanResolution(
      state,
      pledge,
      action.outcome,
      action.reason,
      action.at,
    )
  }
  if (action.type === 'HUMAN_OVERRIDE') {
    return handleHumanOverride(
      state,
      pledge,
      action.outcome,
      action.reason,
      action.at,
    )
  }

  if (
    !isOpenForStake(pledge, action.at) ||
    state.resolutions[pledge.id] ||
    !validateStake(
      state.player.souls,
      action.amount,
      totalStakedOnDay(state.playerStakes, action.at),
      action.dailyStakeCap ?? DEFAULT_DAILY_STAKE_CAP,
    ).ok
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

function isStoredGameState(value: unknown): value is Omit<
  GameState,
  'draftsQueue' | 'decisionsLog' | 'tombstones' | 'sourceRefreshAt'
> & Partial<Pick<
  GameState,
  'draftsQueue' | 'decisionsLog' | 'tombstones' | 'sourceRefreshAt'
>> {
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

    const resolutions = Object.fromEntries(
      Object.entries(parsed.resolutions).map(([pledgeId, result]) => [
        pledgeId,
        {
          ...result,
          resolvedBy: result.resolvedBy ?? 'ai',
          reason: result.reason ?? 'Résolution de démonstration antérieure.',
        },
      ]),
    )

    return {
      ...parsed,
      pledges: parsed.pledges.map((pledge) => {
        const builtIn = demoPledges.find((item) => item.id === pledge.id)
        return {
          ...pledge,
          category: pledge.category ?? builtIn?.category ??
            (pledge.liveSource ? 'SPORT' : 'WORLD'),
        }
      }),
      resolutions,
      draftsQueue: Array.isArray(parsed.draftsQueue) ? parsed.draftsQueue : [],
      decisionsLog: Array.isArray(parsed.decisionsLog) ? parsed.decisionsLog : [],
      tombstones: Array.isArray(parsed.tombstones) ? parsed.tombstones : [],
      sourceRefreshAt: typeof parsed.sourceRefreshAt === 'number' &&
        Number.isFinite(parsed.sourceRefreshAt)
        ? parsed.sourceRefreshAt
        : Date.now(),
    }
  } catch {
    return createInitialGameState()
  }
}

export function useGame(dailyStakeCap = DEFAULT_DAILY_STAKE_CAP) {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadGameState)
  const [sourceAdapter] = useState<ModeAwareSourceAdapter>(() => createAdapter())
  const [sourceMode, setSourceMode] = useState<AdapterMode>(sourceAdapter.mode)
  const [isGeneratingDrafts, setIsGeneratingDrafts] = useState(false)
  const autoLoadStarted = useRef(false)
  const [verifyingPledgeIds, setVerifyingPledgeIds] = useState<readonly string[]>(
    [],
  )

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // The demo remains usable when storage is unavailable or full.
    }
  }, [state])

  const stake = useCallback((pledgeId: string, side: Side, amount: number) => {
    dispatch({
      type: 'STAKE',
      pledgeId,
      side,
      amount,
      at: Date.now(),
      dailyStakeCap,
    })
  }, [dailyStakeCap])

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

  const runPledgeVerifiers = useCallback(
    async (pledgeId: string) => {
      if (verifyingPledgeIds.includes(pledgeId)) {
        return
      }

      const pledge = state.pledges.find((candidate) => candidate.id === pledgeId)
      if (!pledge || !isOpenForStake(pledge) || state.resolutions[pledgeId]) {
        return
      }

      setVerifyingPledgeIds((ids) => [...ids, pledgeId])
      try {
        const checks = await runVerifiers(
          pledge,
          sourcesFor(pledge),
          new FixtureLlm(),
        )
        dispatch({ type: 'RUN_VERIFIERS', pledgeId, checks, at: Date.now() })
      } finally {
        setVerifyingPledgeIds((ids) => ids.filter((id) => id !== pledgeId))
      }
    },
    [state.pledges, state.resolutions, verifyingPledgeIds],
  )

  const humanResolve = useCallback(
    (pledgeId: string, outcome: FinalState, reason: string) => {
      dispatch({
        type: 'HUMAN_RESOLVE',
        pledgeId,
        outcome,
        reason,
        at: Date.now(),
      })
    },
    [],
  )

  const humanOverride = useCallback(
    (pledgeId: string, outcome: FinalState, reason: string) => {
      dispatch({
        type: 'HUMAN_OVERRIDE',
        pledgeId,
        outcome,
        reason,
        at: Date.now(),
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
      const generated = await generateSourceImport(sourceAdapter)
      const refreshedAt = sourceAdapter.lastRefreshAt ?? Date.now()
      setSourceMode(sourceAdapter.mode)
      dispatch({
        type: 'GENERATE_DRAFTS',
        ...generated,
        refreshedAt,
        at: Date.now(),
      })
    } catch (error) {
      try {
        const fallback = await generateSourceImport(new FixtureAdapter())
        setSourceMode('demo')
        dispatch({
          type: 'GENERATE_DRAFTS',
          ...fallback,
          refreshedAt: Date.now(),
          at: Date.now(),
          error: `Repli démo après erreur live : ${error instanceof Error ? error.message : 'erreur inconnue'}`,
        })
      } catch {
        setSourceMode('demo')
        dispatch({
          type: 'GENERATE_DRAFTS',
          drafts: [],
          replays: [],
          refreshedAt: Date.now(),
          at: Date.now(),
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        })
      }
    } finally {
      setIsGeneratingDrafts(false)
    }
  }, [isGeneratingDrafts, sourceAdapter])

  useEffect(() => {
    if (autoLoadStarted.current || sourceAdapter.mode !== 'live') return
    autoLoadStarted.current = true
    void generateDrafts()
  }, [generateDrafts, sourceAdapter])

  useEffect(() => {
    if (!sourceAdapter.supportsLiveRefresh) return
    const timer = window.setInterval(() => void generateDrafts(), 10 * 60 * 1_000)
    return () => window.clearInterval(timer)
  }, [generateDrafts, sourceAdapter])

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
    sourceMode,
    isGeneratingDrafts,
    verifyingPledgeIds,
    stake,
    simulateResolution,
    runPledgeVerifiers,
    humanResolve,
    humanOverride,
    generateDrafts,
    approveDraft,
    editDraft,
    rejectDraft,
    resetDemo,
  }
}
