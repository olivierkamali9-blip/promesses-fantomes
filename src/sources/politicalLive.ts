import type { Candidate, Draft } from '../ai/types'
import { classifyByRules, mergeTier } from '../engine/safety.js'

export type PoliticalCandidate = Candidate & {
  candidateKind: 'political-statement'
  speaker: string
  exactStatement: string
  deadline: string
  sourceName: string
  independentGroup: string
  detectedBy: 'gemini' | 'rules'
}

const COMMITMENT_PATTERN = /\b(promet|a promis|ont promis|promettent|s['’]engage|s['’](?:est|sont) engagé(?:e|s)?|annonce que|a annoncé que|ont annoncé que|garantit|a garanti|garantissent|assure que|a assuré que|assurent que)\b/iu
const ALLOWED_SOURCE_HOSTS = new Set([
  'presidence.cd',
  'communication.gouv.cd',
  'www.radiookapi.net',
])
const SPEAKER_PATTERN = /\b(le président(?: de la république)?|la présidente(?: de la république)?|le chef de l['’]état|le gouvernement|la présidence|le premier ministre|la première ministre|le ministre|la ministre|le parlement|le sénat|l['’]assemblée nationale)\b/iu
const MONTHS: Readonly<Record<string, number>> = {
  janvier: 0,
  fevrier: 1,
  février: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  aout: 7,
  août: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  decembre: 11,
  décembre: 11,
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export function statementDeadline(statement: string, now: number): string | null {
  const normalized = cleanText(statement).toLocaleLowerCase('fr')
  const dated = /(?:avant|d['’]ici|au plus tard(?: le)?)\s+(?:le\s+)?(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(20\d{2})/iu.exec(normalized)
  if (dated) {
    const month = MONTHS[dated[2]]
    const day = Number(dated[1])
    const year = Number(dated[3])
    const deadline = Date.UTC(year, month, day, 23, 59, 59)
    const parsed = new Date(deadline)
    const validCalendarDate = parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month && parsed.getUTCDate() === day
    return validCalendarDate && deadline > now
      ? new Date(deadline).toISOString()
      : null
  }

  const yearMatch = /(?:avant la fin de l['’]année|d['’]ici(?: la fin de l['’]année| fin)?|avant fin|à l['’]horizon|au plus tard en)\s+(20\d{2})/iu.exec(normalized)
  if (!yearMatch) return null
  const deadline = Date.UTC(Number(yearMatch[1]), 11, 31, 23, 59, 59)
  return deadline > now ? new Date(deadline).toISOString() : null
}

export function politicalCandidateFromStatement(
  statement: string,
  source: {
    url: string
    name: string
    independentGroup: string
    publishedAt: string
    detectedBy?: 'gemini' | 'rules'
  },
  now: number,
): PoliticalCandidate | null {
  const exactStatement = cleanText(statement)
  const deadline = statementDeadline(exactStatement, now)
  const speakerMatch = SPEAKER_PATTERN.exec(exactStatement)

  if (
    exactStatement.length < 24 ||
    exactStatement.length > 500 ||
    !COMMITMENT_PATTERN.test(exactStatement) ||
    !speakerMatch ||
    !deadline ||
    !validCandidateUrl(source.url) ||
    !Number.isFinite(Date.parse(source.publishedAt))
  ) {
    return null
  }

  const speaker = speakerMatch[0]
  return {
    candidateKind: 'political-statement',
    title: `${speaker} : engagement public à suivre`,
    sourceUrl: source.url,
    excerpt: exactStatement,
    publishedAt: source.publishedAt,
    speaker,
    exactStatement,
    deadline,
    sourceName: source.name,
    independentGroup: source.independentGroup,
    detectedBy: source.detectedBy ?? 'rules',
  }
}

function validCandidateUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && ALLOWED_SOURCE_HOSTS.has(url.hostname)
  } catch {
    return false
  }
}

export function isPoliticalCandidate(value: unknown): value is PoliticalCandidate {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<PoliticalCandidate>
  return candidate.candidateKind === 'political-statement' &&
    typeof candidate.title === 'string' && candidate.title.length <= 200 &&
    typeof candidate.sourceUrl === 'string' && validCandidateUrl(candidate.sourceUrl) &&
    typeof candidate.excerpt === 'string' && candidate.excerpt.length <= 500 &&
    typeof candidate.publishedAt === 'string' && Number.isFinite(Date.parse(candidate.publishedAt)) &&
    typeof candidate.speaker === 'string' && candidate.speaker.length <= 120 &&
    typeof candidate.exactStatement === 'string' && candidate.exactStatement.length <= 500 &&
    typeof candidate.deadline === 'string' && Number.isFinite(Date.parse(candidate.deadline)) &&
    typeof candidate.sourceName === 'string' && candidate.sourceName.length <= 120 &&
    typeof candidate.independentGroup === 'string' && candidate.independentGroup.length <= 80 &&
    (candidate.detectedBy === 'gemini' || candidate.detectedBy === 'rules')
}

export function draftPoliticalStatement(candidate: PoliticalCandidate): Draft {
  const deadlineLabel = new Intl.DateTimeFormat('fr', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(candidate.deadline))

  return {
    question: `${candidate.speaker} tiendra-t-il cet engagement avant le ${deadlineLabel} ?`,
    criteria: `Une source officielle ou deux sources fiables indépendantes doivent confirmer avant l’échéance que l’action annoncée a été réalisée.`,
    deadline: candidate.deadline,
    sides: {
      kept: {
        argument: 'La déclaration publique contient un engagement et une échéance vérifiables.',
        sourceUrl: candidate.sourceUrl,
      },
      broken: {
        argument: 'La déclaration seule ne prouve pas que l’engagement sera exécuté.',
        sourceUrl: candidate.sourceUrl,
      },
    },
    sources: [{
      url: candidate.sourceUrl,
      kind: 'statement',
      independentGroup: candidate.independentGroup,
    }],
    modelTier: mergeTier(
      'ORANGE',
      classifyByRules(candidate.exactStatement).tier,
    ),
  }
}
