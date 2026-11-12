import type { Source, SourceKind } from '../engine/evidence'
import {
  classifyByRules,
  mergeTier,
  type SafetyTier,
} from '../engine/safety'
import type { LlmClient } from './llm'
import type { Candidate, Draft } from './types'

const SAFETY_TIERS: readonly SafetyTier[] = [
  'GREEN',
  'ORANGE',
  'RED',
  'BLOCKED',
]
const SOURCE_KINDS: readonly SourceKind[] = [
  'statement',
  'reliable',
  'official',
]

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requiredString(record: UnknownRecord, key: string): string {
  const value = record[key]
  if (typeof value !== 'string') {
    throw new Error(`Invalid LLM draft field: ${key}.`)
  }
  return value
}

function parseSide(value: unknown, key: string): Draft['sides']['kept'] {
  if (!isRecord(value)) {
    throw new Error(`Invalid LLM draft field: sides.${key}.`)
  }

  return {
    argument: requiredString(value, 'argument'),
    sourceUrl: requiredString(value, 'sourceUrl'),
  }
}

function parseSource(value: unknown): Source {
  if (!isRecord(value)) {
    throw new Error('Invalid LLM draft source.')
  }

  const kind = value.kind
  if (
    typeof kind !== 'string' ||
    !SOURCE_KINDS.includes(kind as SourceKind)
  ) {
    throw new Error('Invalid LLM draft source kind.')
  }

  return {
    url: requiredString(value, 'url'),
    kind: kind as SourceKind,
    independentGroup: requiredString(value, 'independentGroup'),
  }
}

function parseModelTier(value: unknown): SafetyTier {
  if (
    typeof value !== 'string' ||
    !SAFETY_TIERS.includes(value as SafetyTier)
  ) {
    throw new Error('Invalid LLM draft model tier.')
  }
  return value as SafetyTier
}

function parseResponse(response: string): Draft {
  let value: unknown
  try {
    value = JSON.parse(response)
  } catch {
    throw new Error('Invalid JSON returned by the LLM.')
  }

  if (!isRecord(value) || !isRecord(value.sides)) {
    throw new Error('Invalid LLM draft structure.')
  }
  if (!Array.isArray(value.sources)) {
    throw new Error('Invalid LLM draft sources.')
  }

  return {
    question: requiredString(value, 'question'),
    criteria: requiredString(value, 'criteria'),
    deadline: requiredString(value, 'deadline'),
    sides: {
      kept: parseSide(value.sides.kept, 'kept'),
      broken: parseSide(value.sides.broken, 'broken'),
    },
    sources: value.sources.map(parseSource),
    modelTier: parseModelTier(value.modelTier),
  }
}

function safetyText(candidate: Candidate, draft: Draft): string {
  return [
    candidate.title,
    candidate.excerpt,
    draft.question,
    draft.criteria,
    draft.sides.kept.argument,
    draft.sides.broken.argument,
  ].join(' ')
}

export async function draftPledge(
  llm: LlmClient,
  candidate: Candidate,
): Promise<Draft> {
  const prompt = [
    'Create a verifiable pledge draft from this fictional news candidate.',
    'Return JSON only with question, criteria, deadline, sides, sources, and modelTier.',
    JSON.stringify(candidate),
  ].join('\n')
  const parsedDraft = parseResponse(await llm.complete(prompt))
  const ruleTier = classifyByRules(safetyText(candidate, parsedDraft)).tier

  return {
    ...parsedDraft,
    modelTier: mergeTier(ruleTier, parsedDraft.modelTier),
  }
}
