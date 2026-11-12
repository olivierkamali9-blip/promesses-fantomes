import type { DemoPledge } from '../data/demoPledges'
import type { Source } from '../engine/evidence'
import type { LlmClient } from './llm'

export const VERIFIER_NAMES = ['Archiviste', 'Témoin', 'Greffier'] as const

export type VerifierName = (typeof VERIFIER_NAMES)[number]
export type VerifierOutcome = 'KEPT' | 'BROKEN' | 'INCONCLUSIVE'

export type VerifierCheck = {
  name: VerifierName
  outcome: VerifierOutcome
  confidence: number
  reasons: string[]
}

type VerifierResponse = Omit<VerifierCheck, 'name'>

function parseResponse(raw: string, name: VerifierName): VerifierCheck {
  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error(`Réponse invalide du vérificateur ${name}.`)
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`Réponse invalide du vérificateur ${name}.`)
  }

  const response = parsed as Partial<VerifierResponse>
  const validOutcome =
    response.outcome === 'KEPT' ||
    response.outcome === 'BROKEN' ||
    response.outcome === 'INCONCLUSIVE'
  const validConfidence =
    typeof response.confidence === 'number' &&
    Number.isFinite(response.confidence) &&
    response.confidence >= 0 &&
    response.confidence <= 1
  const validReasons =
    Array.isArray(response.reasons) &&
    response.reasons.length > 0 &&
    response.reasons.every(
      (reason) => typeof reason === 'string' && reason.trim().length > 0,
    )

  if (!validOutcome || !validConfidence || !validReasons) {
    throw new Error(`Réponse invalide du vérificateur ${name}.`)
  }

  return {
    name,
    outcome: response.outcome as VerifierOutcome,
    confidence: response.confidence as number,
    reasons: (response.reasons as string[]).map((reason) => reason.trim()),
  }
}

function verificationPrompt(
  pledge: Pick<DemoPledge, 'id' | 'question' | 'criteria' | 'deadline'>,
  evidenceSources: readonly Source[],
  name: VerifierName,
): string {
  return [
    'PROMESSES_FANTOMES_VERIFICATION',
    `PLEDGE_ID: ${pledge.id}`,
    `VERIFIER: ${name}`,
    `QUESTION: ${pledge.question}`,
    `CRITERIA: ${pledge.criteria}`,
    `DEADLINE: ${pledge.deadline}`,
    `EVIDENCE: ${JSON.stringify(evidenceSources)}`,
    'Réponds uniquement en JSON avec outcome, confidence et reasons.',
  ].join('\n')
}

export async function runVerifiers(
  pledge: Pick<DemoPledge, 'id' | 'question' | 'criteria' | 'deadline'>,
  evidenceSources: readonly Source[],
  llm: LlmClient,
): Promise<VerifierCheck[]> {
  return Promise.all(
    VERIFIER_NAMES.map(async (name) => {
      const raw = await llm.complete(
        verificationPrompt(pledge, evidenceSources, name),
      )
      return parseResponse(raw, name)
    }),
  )
}
