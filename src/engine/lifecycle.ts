import { canResolve } from './evidence'

export type LifecycleState =
  | 'MURMUR'
  | 'APPARITION'
  | 'HAUNTING'
  | 'KEPT'
  | 'BROKEN'
  | 'INCONCLUSIVE'

export type FinalState = 'KEPT' | 'BROKEN' | 'INCONCLUSIVE'
export type ResolutionOutcome = FinalState

export type ApproveEvent = { type: 'APPROVE' }
export type ResolveEvent = {
  type: 'RESOLVE'
  outcome: ResolutionOutcome
  evidenceLevel: number
}
export type OverrideEvent = {
  type: 'OVERRIDE'
  outcome: ResolutionOutcome
}
export type LifecycleEvent = ApproveEvent | ResolveEvent | OverrideEvent

export type OverrideResult = {
  state: FinalState
  tombstone: true
}

const FINAL_STATES: ReadonlySet<LifecycleState> = new Set([
  'KEPT',
  'BROKEN',
  'INCONCLUSIVE',
])

function isFinalState(state: LifecycleState): state is FinalState {
  return FINAL_STATES.has(state)
}

function hasResolvableEvidence(level: number): boolean {
  return (level === 3 || level === 4) && canResolve(level)
}

export function resolvePledge(
  state: LifecycleState,
  outcome: ResolutionOutcome,
  evidenceLevel: number,
): FinalState {
  if (state !== 'APPARITION' && state !== 'HAUNTING') {
    throw new Error(`Cannot resolve state ${state}`)
  }

  if (
    (outcome === 'KEPT' || outcome === 'BROKEN') &&
    !hasResolvableEvidence(evidenceLevel)
  ) {
    return 'INCONCLUSIVE'
  }

  return outcome
}

export function applyEvent(
  state: LifecycleState,
  event: ApproveEvent | ResolveEvent,
): LifecycleState
export function applyEvent(
  state: LifecycleState,
  event: OverrideEvent,
): OverrideResult
export function applyEvent(
  state: LifecycleState,
  event: LifecycleEvent,
): LifecycleState | OverrideResult
export function applyEvent(
  state: LifecycleState,
  event: LifecycleEvent,
): LifecycleState | OverrideResult {
  if (event.type === 'OVERRIDE') {
    if (!isFinalState(state)) {
      throw new Error(`Cannot override non-final state ${state}`)
    }

    return { state: event.outcome, tombstone: true }
  }

  if (event.type === 'APPROVE') {
    if (state !== 'MURMUR') {
      throw new Error(`Cannot approve state ${state}`)
    }

    return 'APPARITION'
  }

  return resolvePledge(state, event.outcome, event.evidenceLevel)
}

const HAUNTING_WINDOW_MS = 24 * 60 * 60 * 1_000

export function timeState(
  state: LifecycleState,
  now: Date,
  deadline: Date,
): LifecycleState {
  if (
    state === 'APPARITION' &&
    now.getTime() >= deadline.getTime() - HAUNTING_WINDOW_MS
  ) {
    return 'HAUNTING'
  }

  return state
}
