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

type VerificationFixture = {
  outcome: 'KEPT' | 'BROKEN' | 'INCONCLUSIVE'
  confidence: number
  reasons: string[]
}

const FIXTURE_VERDICTS: Readonly<
  Record<string, readonly [VerificationFixture, VerificationFixture, VerificationFixture]>
> = {
  'finale-coupe-demo': [
    { outcome: 'KEPT', confidence: 0.92, reasons: ['Le résultat officiel fictif confirme la victoire.'] },
    { outcome: 'KEPT', confidence: 0.9, reasons: ['Les deux sources indépendantes concordent.'] },
    { outcome: 'KEPT', confidence: 0.94, reasons: ['Le critère et l’échéance sont satisfaits.'] },
  ],
  'navette-ville-exemple': [
    { outcome: 'KEPT', confidence: 0.7, reasons: ['L’annonce indique un lancement.'] },
    { outcome: 'BROKEN', confidence: 0.64, reasons: ['Aucun trajet public n’est confirmé.'] },
    { outcome: 'INCONCLUSIVE', confidence: 0.58, reasons: ['Une seule déclaration est disponible.'] },
  ],
  'rapport-centre-sante-demo': [
    { outcome: 'INCONCLUSIVE', confidence: 0.72, reasons: ['Le bulletin officiel manque.'] },
    { outcome: 'INCONCLUSIVE', confidence: 0.69, reasons: ['La source unique ne suffit pas.'] },
    { outcome: 'INCONCLUSIVE', confidence: 0.75, reasons: ['Le critère horaire reste invérifiable.'] },
  ],
  'academie-demo-tournoi': [
    { outcome: 'BROKEN', confidence: 0.88, reasons: ['Le classement fictif ne place pas l’académie première.'] },
    { outcome: 'BROKEN', confidence: 0.86, reasons: ['La feuille de tournoi indique une autre équipe.'] },
    { outcome: 'BROKEN', confidence: 0.9, reasons: ['Le critère de victoire n’est pas satisfait.'] },
  ],
  'passage-pieton-exemple': [
    { outcome: 'INCONCLUSIVE', confidence: 0.63, reasons: ['La réouverture n’est pas documentée.'] },
    { outcome: 'INCONCLUSIVE', confidence: 0.61, reasons: ['Aucun contrôle indépendant n’est fourni.'] },
    { outcome: 'INCONCLUSIVE', confidence: 0.66, reasons: ['La note seule ne prouve pas l’ouverture.'] },
  ],
  'commission-archipel-resultats': [
    { outcome: 'KEPT', confidence: 0.93, reasons: ['Le tableau fictif est publié.'] },
    { outcome: 'KEPT', confidence: 0.91, reasons: ['La date annoncée est respectée.'] },
    { outcome: 'KEPT', confidence: 0.92, reasons: ['Le document répond au critère, sous contrôle humain.'] },
  ],
  'coupe-des-brumes': [
    { outcome: 'KEPT', confidence: 0.67, reasons: ['Une annonce suggère la qualification.'] },
    { outcome: 'INCONCLUSIVE', confidence: 0.59, reasons: ['Le tableau officiel manque.'] },
    { outcome: 'BROKEN', confidence: 0.55, reasons: ['La source ne confirme pas la finale.'] },
  ],
  'rapport-ministre-exemple': [
    { outcome: 'BROKEN', confidence: 0.89, reasons: ['Le registre fictif ne contient pas le rapport.'] },
    { outcome: 'BROKEN', confidence: 0.87, reasons: ['L’échéance est dépassée sans publication.'] },
    { outcome: 'BROKEN', confidence: 0.9, reasons: ['Le critère de mise à disposition échoue.'] },
  ],
  'tribunal-calendrier-demo': [
    { outcome: 'INCONCLUSIVE', confidence: 0.7, reasons: ['Le calendrier validé manque.'] },
    { outcome: 'INCONCLUSIVE', confidence: 0.68, reasons: ['L’avis ne confirme pas une publication.'] },
    { outcome: 'INCONCLUSIVE', confidence: 0.72, reasons: ['Le greffe fictif ne fournit pas de document final.'] },
  ],
  'match-rivage-demo': [
    { outcome: 'KEPT', confidence: 0.98, reasons: ['La feuille officielle indique une victoire.'] },
    { outcome: 'KEPT', confidence: 0.97, reasons: ['Le résultat primaire confirme le score.'] },
    { outcome: 'KEPT', confidence: 0.99, reasons: ['Le document satisfait exactement le critère.'] },
  ],
  'fontaine-place-exemple': [
    { outcome: 'BROKEN', confidence: 0.91, reasons: ['Le premier contrôle constate l’arrêt.'] },
    { outcome: 'BROKEN', confidence: 0.9, reasons: ['Le second contrôle indépendant concorde.'] },
    { outcome: 'BROKEN', confidence: 0.92, reasons: ['Les contrôles échouent le critère de continuité.'] },
  ],
  'alerte-clinique-imaginaire': [
    { outcome: 'INCONCLUSIVE', confidence: 0.74, reasons: ['Le compte rendu daté manque.'] },
    { outcome: 'INCONCLUSIVE', confidence: 0.71, reasons: ['Les horaires ne sont pas confirmés.'] },
    { outcome: 'INCONCLUSIVE', confidence: 0.76, reasons: ['Le niveau de preuve reste insuffisant.'] },
  ],
}

const FIXTURE_VERIFIER_NAMES = ['Archiviste', 'Témoin', 'Greffier'] as const

function verificationFixtureResponse(prompt: string): string | null {
  if (!prompt.includes('PROMESSES_FANTOMES_VERIFICATION')) {
    return null
  }

  const pledgeId = /^PLEDGE_ID:\s*(.+)$/m.exec(prompt)?.[1]?.trim()
  const verifierName = /^VERIFIER:\s*(.+)$/m.exec(prompt)?.[1]?.trim()
  const verifierIndex = FIXTURE_VERIFIER_NAMES.findIndex(
    (name) => name === verifierName,
  )

  if (!pledgeId || verifierIndex < 0) {
    return JSON.stringify({
      outcome: 'INCONCLUSIVE',
      confidence: 0,
      reasons: ['La fixture ne reconnaît pas cette vérification.'],
    })
  }

  const fallback: VerificationFixture = {
    outcome: 'INCONCLUSIVE',
    confidence: 0.6,
    reasons: ['Cette promesse de démonstration exige un examen humain.'],
  }
  const fixture = FIXTURE_VERDICTS[pledgeId]?.[verifierIndex] ?? fallback
  return JSON.stringify(fixture)
}

export class FixtureLlm implements LlmClient {
  complete(prompt: string): Promise<string> {
    const verificationResponse = verificationFixtureResponse(prompt)
    if (verificationResponse !== null) {
      return Promise.resolve(verificationResponse)
    }

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
