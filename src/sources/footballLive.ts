import type { Candidate, Draft } from '../ai/types'
import { evidenceLevel, type Source } from '../engine/evidence.js'

export type LiveMatchStatus = 'SCHEDULED' | 'FINISHED' | 'OTHER'

export type LiveMatch = {
  competition: string
  kickoffUtc: string
  home: string
  away: string
  status: LiveMatchStatus
  scoreFt: [number, number] | null
  sourceName: string
}

export type ConfirmedResult = {
  sources: Source[]
  conflict: boolean
}

export type LiveFootballPhase = 'UPCOMING' | 'REPLAY'

export type LiveFootballCandidate = Candidate & {
  candidateKind: 'live-football'
  phase: LiveFootballPhase
  matches: LiveMatch[]
  evidenceSources: Source[]
  conflict: boolean
}

type UnknownRecord = Record<string, unknown>

const FOOTBALL_DATA_SOURCE = 'football-data.org'
const OPEN_FOOTBALL_SOURCE = 'openfootball'
const FOOTBALL_DATA_URL = 'https://www.football-data.org/'
const OPEN_FOOTBALL_URL = 'https://github.com/openfootball/football.json'
const DAY_MS = 24 * 60 * 60 * 1_000

export function openFootballSeasonFolder(season: string): string {
  if (/^\d{4}-\d{2}$/.test(season)) {
    return season
  }

  if (/^\d{4}$/.test(season)) {
    const year = Number(season)
    return `${season}-${String((year + 1) % 100).padStart(2, '0')}`
  }

  return season
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizedIsoDate(value: unknown): string | null {
  if (!nonEmptyString(value)) {
    return null
  }

  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null
}

function fullTimeScore(value: unknown): [number, number] | null {
  if (!Array.isArray(value) || value.length !== 2) {
    return null
  }

  const [home, away] = value
  return typeof home === 'number' &&
    typeof away === 'number' &&
    Number.isInteger(home) &&
    Number.isInteger(away) &&
    home >= 0 &&
    away >= 0
    ? [home, away]
    : null
}

function footballDataScore(value: unknown): [number, number] | null {
  if (!isRecord(value) || !isRecord(value.fullTime)) {
    return null
  }

  return fullTimeScore([value.fullTime.home, value.fullTime.away])
}

function footballDataStatus(value: unknown): LiveMatchStatus {
  if (value === 'SCHEDULED' || value === 'TIMED') {
    return 'SCHEDULED'
  }
  if (value === 'FINISHED') {
    return 'FINISHED'
  }
  return 'OTHER'
}

function openFootballKickoff(date: unknown, time: unknown): string | null {
  if (
    !nonEmptyString(date) ||
    !nonEmptyString(time) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^\d{2}:\d{2}(?::\d{2})?$/.test(time)
  ) {
    return null
  }

  const withSeconds = time.length === 5 ? `${time}:00` : time
  const kickoff = normalizedIsoDate(`${date}T${withSeconds}Z`)
  return kickoff?.startsWith(date) ? kickoff : null
}

export function normalizeFootballData(json: unknown): LiveMatch[] {
  if (!isRecord(json) || !Array.isArray(json.matches)) {
    return []
  }

  const rootCompetition = isRecord(json.competition) && nonEmptyString(json.competition.name)
    ? json.competition.name.trim()
    : null

  return json.matches.flatMap((item): LiveMatch[] => {
    if (!isRecord(item)) {
      return []
    }

    const competition = isRecord(item.competition) && nonEmptyString(item.competition.name)
      ? item.competition.name.trim()
      : rootCompetition
    const kickoffUtc = normalizedIsoDate(item.utcDate)
    const home = isRecord(item.homeTeam) && nonEmptyString(item.homeTeam.name)
      ? item.homeTeam.name.trim()
      : null
    const away = isRecord(item.awayTeam) && nonEmptyString(item.awayTeam.name)
      ? item.awayTeam.name.trim()
      : null

    if (!competition || !kickoffUtc || !home || !away) {
      return []
    }

    return [{
      competition,
      kickoffUtc,
      home,
      away,
      status: footballDataStatus(item.status),
      scoreFt: isRecord(item.score) ? footballDataScore(item.score) : null,
      sourceName: FOOTBALL_DATA_SOURCE,
    }]
  })
}

export function normalizeOpenFootball(json: unknown): LiveMatch[] {
  if (!isRecord(json) || !nonEmptyString(json.name) || !Array.isArray(json.matches)) {
    return []
  }

  const competition = json.name.trim()
  return json.matches.flatMap((item): LiveMatch[] => {
    if (!isRecord(item)) {
      return []
    }

    const kickoffUtc = openFootballKickoff(item.date, item.time)
    const home = nonEmptyString(item.team1) ? item.team1.trim() : null
    const away = nonEmptyString(item.team2) ? item.team2.trim() : null
    const scoreFt = isRecord(item.score) ? fullTimeScore(item.score.ft) : null

    if (!kickoffUtc || !home || !away) {
      return []
    }

    return [{
      competition,
      kickoffUtc,
      home,
      away,
      status: scoreFt ? 'FINISHED' : 'SCHEDULED',
      scoreFt,
      sourceName: OPEN_FOOTBALL_SOURCE,
    }]
  })
}

function normalizedTeamName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('fr')
    .replace(
      /(^|[^\p{L}\p{N}])(?:a[\s._-]*f[\s._-]*c|f[\s._-]*c|c[\s._-]*f)(?=$|[^\p{L}\p{N}])/gu,
      ' ',
    )
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(/\s+/)
    .filter((part) => part.length > 0 && part !== 'fc' && part !== 'afc' && part !== 'cf')
    .join(' ')
}

export function sameTeam(a: string, b: string): boolean {
  const left = normalizedTeamName(a)
  const right = normalizedTeamName(b)
  return left.length > 0 && left === right
}

function sourceDetails(sourceName: string): Pick<Source, 'url' | 'independentGroup'> {
  const normalized = normalizedTeamName(sourceName)
  if (normalized.includes('openfootball')) {
    return { url: OPEN_FOOTBALL_URL, independentGroup: 'openfootball' }
  }

  if (normalized.includes('football data')) {
    return { url: FOOTBALL_DATA_URL, independentGroup: 'football-data' }
  }

  return {
    url: FOOTBALL_DATA_URL,
    independentGroup: normalized.replace(/\s+/g, '-') || 'football-source',
  }
}

function reliableSource(match: LiveMatch): Source | null {
  if (match.status !== 'FINISHED' || match.scoreFt === null) {
    return null
  }

  return { ...sourceDetails(match.sourceName), kind: 'reliable' }
}

function fixtureOrientation(a: LiveMatch, b: LiveMatch): 'SAME' | 'REVERSED' | null {
  if (sameTeam(a.home, b.home) && sameTeam(a.away, b.away)) {
    return 'SAME'
  }
  if (sameTeam(a.home, b.away) && sameTeam(a.away, b.home)) {
    return 'REVERSED'
  }
  return null
}

export function confirmResult(
  matchA: LiveMatch | null | undefined,
  matchB: LiveMatch | null | undefined,
): ConfirmedResult {
  const sourceA = matchA ? reliableSource(matchA) : null
  const sourceB = matchB ? reliableSource(matchB) : null

  if (!sourceA && !sourceB) {
    return { sources: [], conflict: false }
  }
  if (!sourceA || !matchA) {
    return { sources: sourceB ? [sourceB] : [], conflict: false }
  }
  if (!sourceB || !matchB) {
    return { sources: [sourceA], conflict: false }
  }

  const orientation = fixtureOrientation(matchA, matchB)
  const scoreB = orientation === 'REVERSED'
    ? [matchB.scoreFt![1], matchB.scoreFt![0]] as [number, number]
    : matchB.scoreFt
  const scoresAgree = orientation !== null && scoreB !== null &&
    matchA.scoreFt![0] === scoreB[0] && matchA.scoreFt![1] === scoreB[1]

  if (!scoresAgree) {
    return { sources: [], conflict: true }
  }

  const sources = [sourceA, sourceB].filter(
    (source, index, all) =>
      all.findIndex((candidate) => candidate.independentGroup === source.independentGroup) === index,
  )
  return { sources, conflict: false }
}

export function isLiveMatch(value: unknown): value is LiveMatch {
  if (!isRecord(value)) {
    return false
  }

  return nonEmptyString(value.competition) &&
    normalizedIsoDate(value.kickoffUtc) !== null &&
    nonEmptyString(value.home) &&
    nonEmptyString(value.away) &&
    (value.status === 'SCHEDULED' || value.status === 'FINISHED' || value.status === 'OTHER') &&
    (value.scoreFt === null || fullTimeScore(value.scoreFt) !== null) &&
    nonEmptyString(value.sourceName)
}

function sameFixture(a: LiveMatch, b: LiveMatch): boolean {
  if (fixtureOrientation(a, b) === null) {
    return false
  }

  const left = new Date(a.kickoffUtc).getTime()
  const right = new Date(b.kickoffUtc).getTime()
  return Math.abs(left - right) <= 36 * 60 * 60 * 1_000
}

function scheduleSource(match: LiveMatch): Source {
  return { ...sourceDetails(match.sourceName), kind: 'reliable' }
}

export function footballMatchesToCandidates(
  matches: readonly LiveMatch[],
): LiveFootballCandidate[] {
  const usable = matches.filter(isLiveMatch)
  const consumed = new Set<number>()
  const candidates: LiveFootballCandidate[] = []

  usable.forEach((match, index) => {
    if (consumed.has(index) || match.status === 'OTHER') {
      return
    }

    const partnerIndex = usable.findIndex(
      (candidate, candidateIndex) =>
        candidateIndex > index &&
        !consumed.has(candidateIndex) &&
        sourceDetails(candidate.sourceName).independentGroup !==
          sourceDetails(match.sourceName).independentGroup &&
        sameFixture(match, candidate),
    )
    const partner = partnerIndex >= 0 ? usable[partnerIndex] : undefined
    if (partner) {
      consumed.add(partnerIndex)
    }
    consumed.add(index)

    const confirmation = confirmResult(match, partner)
    const hasFinalResult = match.status === 'FINISHED' || partner?.status === 'FINISHED'
    const scheduleMatches = partner ? [match, partner] : [match]
    const evidenceSources = hasFinalResult
      ? confirmation.sources
      : scheduleMatches
          .map(scheduleSource)
          .filter(
            (source, sourceIndex, all) =>
              all.findIndex((candidate) =>
                candidate.independentGroup === source.independentGroup,
              ) === sourceIndex,
          )
    const title = `${match.home} – ${match.away} (${match.competition})`

    candidates.push({
      candidateKind: 'live-football',
      phase: hasFinalResult ? 'REPLAY' : 'UPCOMING',
      title,
      sourceUrl: sourceDetails(match.sourceName).url,
      excerpt: `Match de football prévu le ${match.kickoffUtc}.`,
      publishedAt: match.kickoffUtc,
      matches: partner ? [match, partner] : [match],
      evidenceSources,
      conflict: confirmation.conflict,
    })
  })

  return candidates.sort(
    (left, right) => Date.parse(left.publishedAt) - Date.parse(right.publishedAt),
  )
}

export function selectLiveFootballCandidates(
  candidates: readonly LiveFootballCandidate[],
  now: number,
): LiveFootballCandidate[] {
  const latestUpcoming = now + 7 * DAY_MS
  const upcoming = candidates
    .filter((candidate) => {
      const kickoff = Date.parse(candidate.publishedAt)
      return candidate.phase === 'UPCOMING' &&
        kickoff >= now && kickoff <= latestUpcoming
    })
    .sort((left, right) => Date.parse(left.publishedAt) - Date.parse(right.publishedAt))
    .slice(0, 6)
  const replays = candidates
    .filter((candidate) =>
      candidate.phase === 'REPLAY' &&
      !candidate.conflict &&
      evidenceLevel(candidate.evidenceSources) >= 3,
    )
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt))
    .slice(0, 3)

  return [...upcoming, ...replays]
}

export function isLiveFootballCandidate(value: unknown): value is LiveFootballCandidate {
  const candidate = value as Partial<LiveFootballCandidate>
  return candidate.candidateKind === 'live-football' &&
    (candidate.phase === 'UPCOMING' || candidate.phase === 'REPLAY') &&
    Array.isArray(candidate.matches) &&
    candidate.matches.length > 0 &&
    candidate.matches.every(isLiveMatch) &&
    Array.isArray(candidate.evidenceSources) &&
    typeof candidate.conflict === 'boolean'
}

export function draftLiveFootball(candidate: LiveFootballCandidate): Draft {
  const match = candidate.matches[0]
  return {
    question: `${match.home} gagnera-t-il contre ${match.away} ?`,
    criteria: `Le score après 90 minutes doit donner plus de buts à ${match.home} qu’à ${match.away}.`,
    deadline: new Date(Date.parse(match.kickoffUtc) + 2 * 60 * 60 * 1_000).toISOString(),
    sides: {
      kept: {
        argument: `${match.home} est annoncé pour ce match de football.`,
        sourceUrl: candidate.sourceUrl,
      },
      broken: {
        argument: `Une programmation ne garantit ni victoire ni résultat final.`,
        sourceUrl: candidate.sourceUrl,
      },
    },
    sources: candidate.evidenceSources.map((source) => ({ ...source })),
    modelTier: 'GREEN',
  }
}
