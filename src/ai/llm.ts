import type { SourceKind } from '../engine/evidence'
import type { SafetyTier } from '../engine/safety'

export interface LlmClient {
  complete(prompt: string): Promise<string>
}

type FixturePlan = {
  question: string
  criteria: string
  keptArgument: string
  brokenArgument: string
  deadline: string
  sourceKind: SourceKind
  independentGroup: string
  modelTier: SafetyTier
}

const FIXTURE_PLANS: Readonly<Record<string, FixturePlan>> = {
  'https://example.org/news/sporting-brume-finale': {
    question: 'Le Sporting Brume remportera-t-il la finale de la Coupe des Lanternes ?',
    criteria:
      'Le résultat final publié par la ligue fictive désigne le Sporting Brume vainqueur.',
    keptArgument: 'Le club est inscrit à la finale annoncée.',
    brokenArgument: 'Une participation ne garantit pas une victoire.',
    deadline: '2099-12-31T18:00:00.000Z',
    sourceKind: 'reliable',
    independentGroup: 'ligue-des-lanternes',
    modelTier: 'GREEN',
  },
  'https://example.org/news/belrivage-navette': {
    question: 'La Mairie de Belrivage lancera-t-elle sa navette avant l’échéance ?',
    criteria:
      'Une navette doit effectuer un trajet public complet sur le parcours annoncé.',
    keptArgument: 'La mairie fictive a présenté un calendrier de lancement.',
    brokenArgument: 'Le service peut être reporté avant son premier trajet public.',
    deadline: '2099-11-30T18:00:00.000Z',
    sourceKind: 'statement',
    independentGroup: 'mairie-belrivage',
    modelTier: 'ORANGE',
  },
  'https://example.org/news/festival-lucioles-programme': {
    question: 'Le Festival des Lucioles publiera-t-il son programme complet avant l’échéance ?',
    criteria:
      'Le programme daté doit être accessible au public sur le site fictif du festival.',
    keptArgument: 'L’organisation a annoncé une date de publication.',
    brokenArgument: 'Le programme complet peut rester indisponible après cette date.',
    deadline: '2099-10-31T18:00:00.000Z',
    sourceKind: 'statement',
    independentGroup: 'festival-des-lucioles',
    modelTier: 'ORANGE',
  },
  'https://example.org/news/ligue-collines-match': {
    question: 'Le FC Horizon gagnera-t-il le match fixé par la Ligue des Collines ?',
    criteria:
      'La feuille de match fictive doit désigner le FC Horizon vainqueur après la rencontre.',
    keptArgument: 'Le match figure au calendrier de la ligue fictive.',
    brokenArgument: 'Le calendrier ne permet pas de prévoir le résultat.',
    deadline: '2099-09-30T18:00:00.000Z',
    sourceKind: 'reliable',
    independentGroup: 'ligue-des-collines',
    modelTier: 'GREEN',
  },
  'https://example.org/news/archipel-azur-election': {
    question: 'La commission de l’élection fictive d’Archipel Azur publiera-t-elle son tableau de résultats ?',
    criteria:
      'Le tableau complet et daté doit être disponible sur le portail fictif de la commission.',
    keptArgument: 'La commission imaginaire annonce une publication après le scrutin.',
    brokenArgument: 'La publication peut être retardée ou rester incomplète.',
    deadline: '2099-08-31T18:00:00.000Z',
    sourceKind: 'statement',
    independentGroup: 'commission-archipel-azur',
    modelTier: 'GREEN',
  },
  'https://example.org/news/nebuleuse-bulletin': {
    question: 'Le Centre Médical Nébuleuse publiera-t-il son bulletin d’épidémie simulée ?',
    criteria:
      'Le bulletin fictif daté doit être accessible au public avant l’échéance.',
    keptArgument: 'Le centre imaginaire prépare ce bulletin de simulation.',
    brokenArgument: 'La préparation annoncée peut ne pas aboutir à une publication.',
    deadline: '2099-07-31T18:00:00.000Z',
    sourceKind: 'statement',
    independentGroup: 'centre-nebuleuse',
    modelTier: 'GREEN',
  },
}

function fixtureResponse(sourceUrl: string, plan: FixturePlan): string {
  return JSON.stringify({
    question: plan.question,
    criteria: plan.criteria,
    deadline: plan.deadline,
    sides: {
      kept: { argument: plan.keptArgument, sourceUrl },
      broken: { argument: plan.brokenArgument, sourceUrl },
    },
    sources: [
      {
        url: sourceUrl,
        kind: plan.sourceKind,
        independentGroup: plan.independentGroup,
      },
    ],
    modelTier: plan.modelTier,
  })
}

export class FixtureLlm implements LlmClient {
  complete(prompt: string): Promise<string> {
    const fixture = Object.entries(FIXTURE_PLANS).find(([sourceUrl]) =>
      prompt.includes(sourceUrl),
    )

    if (fixture === undefined) {
      return Promise.reject(new Error('No deterministic LLM fixture matches this prompt.'))
    }

    return Promise.resolve(fixtureResponse(fixture[0], fixture[1]))
  }
}

export function createLlm(): LlmClient {
  const environment = (
    import.meta as ImportMeta & {
      readonly env?: Readonly<Record<string, string | undefined>>
    }
  ).env
  const demoMode = environment?.VITE_DEMO === '1'
  const endpoint = environment?.VITE_LLM_ENDPOINT?.trim()

  if (demoMode || !endpoint) {
    return new FixtureLlm()
  }

  throw new Error(
    'Remote LLM access is not implemented. Configure it later through a server function.',
  )
}
