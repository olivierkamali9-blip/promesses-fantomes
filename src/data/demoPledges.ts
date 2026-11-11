import type { EvidenceLevel, Source } from '../engine/evidence'
import type { LifecycleState } from '../engine/lifecycle'
import type { SafetyTier } from '../engine/safety'
import type { Side } from '../engine/souls'

export type DemoSource = Source & {
  label: string
}

export type DemoPledge = {
  id: string
  question: string
  criteria: string
  deadline: string
  state: LifecycleState
  evidenceLevel: EvidenceLevel
  tier: Exclude<SafetyTier, 'BLOCKED'>
  stakes: Readonly<Record<Side, number>>
  sources: readonly DemoSource[]
}

const referenceTime = Date.now()
const HOUR_MS = 60 * 60 * 1_000

function hoursFromNow(hours: number): string {
  return new Date(referenceTime + hours * HOUR_MS).toISOString()
}

export const demoPledges: readonly DemoPledge[] = [
  {
    id: 'finale-coupe-demo',
    question: 'Le FC Démo remportera-t-il la finale contre l’AS Test ?',
    criteria: 'Le résultat officiel après le temps réglementaire et les éventuelles prolongations désigne le FC Démo vainqueur.',
    deadline: hoursFromNow(6),
    state: 'APPARITION',
    evidenceLevel: 2,
    tier: 'GREEN',
    stakes: { KEPT: 720, BROKEN: 480 },
    sources: [
      {
        label: 'Calendrier de la Ligue Exemple',
        url: 'https://example.org/sources/ligue-exemple-calendrier',
        kind: 'reliable',
        independentGroup: 'ligue-exemple',
      },
      {
        label: 'Programme du Stade Démonstration',
        url: 'https://example.org/sources/stade-demonstration-programme',
        kind: 'statement',
        independentGroup: 'stade-demonstration',
      },
    ],
  },
  {
    id: 'navette-ville-exemple',
    question: 'La Mairie de Ville-Exemple lancera-t-elle la navette nocturne avant l’échéance ?',
    criteria: 'Au moins une navette doit effectuer un trajet public complet sur l’itinéraire annoncé.',
    deadline: hoursFromNow(6),
    state: 'HAUNTING',
    evidenceLevel: 1,
    tier: 'ORANGE',
    stakes: { KEPT: 310, BROKEN: 690 },
    sources: [
      {
        label: 'Annonce municipale fictive',
        url: 'https://example.org/sources/ville-exemple-navette',
        kind: 'statement',
        independentGroup: 'mairie-ville-exemple',
      },
    ],
  },
  {
    id: 'rapport-centre-sante-demo',
    question: 'Le Centre de santé Démo publiera-t-il son bulletin hebdomadaire avant midi ?',
    criteria: 'Le bulletin daté doit être accessible au public sur le portail fictif du centre avant l’échéance.',
    deadline: hoursFromNow(6),
    state: 'MURMUR',
    evidenceLevel: 1,
    tier: 'RED',
    stakes: { KEPT: 150, BROKEN: 150 },
    sources: [
      {
        label: 'Avis du Centre de santé Démo',
        url: 'https://example.org/sources/centre-sante-demo-avis',
        kind: 'statement',
        independentGroup: 'centre-sante-demo',
      },
    ],
  },
  {
    id: 'academie-demo-tournoi',
    question: 'L’Académie Démo gagnera-t-elle son tournoi amical ?',
    criteria: 'Le classement final publié par l’organisateur place l’Académie Démo en première position.',
    deadline: hoursFromNow(48),
    state: 'APPARITION',
    evidenceLevel: 2,
    tier: 'GREEN',
    stakes: { KEPT: 840, BROKEN: 360 },
    sources: [
      {
        label: 'Feuille de tournoi fictive',
        url: 'https://example.org/sources/tournoi-amical-demo',
        kind: 'reliable',
        independentGroup: 'organisateur-tournoi-demo',
      },
    ],
  },
  {
    id: 'passage-pieton-exemple',
    question: 'La Mairie de Quartier-Exemple rouvrira-t-elle le passage piéton annoncé ?',
    criteria: 'Le passage doit être ouvert, signalé et praticable par le public avant l’échéance.',
    deadline: hoursFromNow(48),
    state: 'MURMUR',
    evidenceLevel: 1,
    tier: 'ORANGE',
    stakes: { KEPT: 275, BROKEN: 425 },
    sources: [
      {
        label: 'Note de Quartier-Exemple',
        url: 'https://example.org/sources/quartier-exemple-passage',
        kind: 'statement',
        independentGroup: 'mairie-quartier-exemple',
      },
    ],
  },
  {
    id: 'commission-archipel-resultats',
    question: 'La Commission électorale d’Archipel-Exemple publiera-t-elle son tableau fictif à temps ?',
    criteria: 'Le tableau complet, daté et signé doit apparaître sur le portail de démonstration avant l’échéance.',
    deadline: hoursFromNow(48),
    state: 'APPARITION',
    evidenceLevel: 2,
    tier: 'RED',
    stakes: { KEPT: 510, BROKEN: 490 },
    sources: [
      {
        label: 'Calendrier électoral fictif',
        url: 'https://example.org/sources/archipel-exemple-calendrier',
        kind: 'reliable',
        independentGroup: 'commission-archipel-exemple',
      },
      {
        label: 'Rappel de publication fictif',
        url: 'https://example.org/sources/archipel-exemple-rappel',
        kind: 'statement',
        independentGroup: 'commission-archipel-exemple',
      },
    ],
  },
  {
    id: 'coupe-des-brumes',
    question: 'Le Sporting Imaginaire atteindra-t-il la finale de la Coupe des Brumes ?',
    criteria: 'Le tableau officiel fictif doit qualifier le Sporting Imaginaire pour la finale.',
    deadline: hoursFromNow(240),
    state: 'APPARITION',
    evidenceLevel: 1,
    tier: 'GREEN',
    stakes: { KEPT: 930, BROKEN: 570 },
    sources: [
      {
        label: 'Annonce de la Coupe des Brumes',
        url: 'https://example.org/sources/coupe-des-brumes-annonce',
        kind: 'statement',
        independentGroup: 'coupe-des-brumes',
      },
    ],
  },
  {
    id: 'rapport-ministre-exemple',
    question: 'Le Ministre de l’Exemple remettra-t-il le rapport sur les lampadaires fictifs ?',
    criteria: 'Le rapport complet doit être enregistré et rendu public sur le portail de Ville-Exemple.',
    deadline: hoursFromNow(240),
    state: 'APPARITION',
    evidenceLevel: 2,
    tier: 'ORANGE',
    stakes: { KEPT: 640, BROKEN: 860 },
    sources: [
      {
        label: 'Registre public de démonstration',
        url: 'https://example.org/sources/ministre-exemple-registre',
        kind: 'reliable',
        independentGroup: 'registre-ville-exemple',
      },
      {
        label: 'Programme ministériel fictif',
        url: 'https://example.org/sources/ministre-exemple-programme',
        kind: 'statement',
        independentGroup: 'ministere-exemple',
      },
    ],
  },
  {
    id: 'tribunal-calendrier-demo',
    question: 'Le Tribunal de Démonstration publiera-t-il le calendrier de l’audience fictive ?',
    criteria: 'Un calendrier daté doit être validé par le greffe fictif et accessible avant l’échéance.',
    deadline: hoursFromNow(240),
    state: 'MURMUR',
    evidenceLevel: 1,
    tier: 'RED',
    stakes: { KEPT: 225, BROKEN: 375 },
    sources: [
      {
        label: 'Avis du greffe fictif',
        url: 'https://example.org/sources/tribunal-demo-avis',
        kind: 'statement',
        independentGroup: 'tribunal-demonstration',
      },
    ],
  },
  {
    id: 'match-rivage-demo',
    question: 'Le Club Rivage-Démo a-t-il remporté le match amical annoncé ?',
    criteria: 'La feuille de match officielle fictive indique une victoire du Club Rivage-Démo.',
    deadline: hoursFromNow(-30),
    state: 'KEPT',
    evidenceLevel: 4,
    tier: 'GREEN',
    stakes: { KEPT: 780, BROKEN: 220 },
    sources: [
      {
        label: 'Feuille de match officielle fictive',
        url: 'https://example.org/sources/rivage-demo-feuille-officielle',
        kind: 'official',
        independentGroup: 'federation-sportive-demo',
      },
    ],
  },
  {
    id: 'fontaine-place-exemple',
    question: 'La Mairie de Ville-Exemple a-t-elle remis en service la fontaine fictive à temps ?',
    criteria: 'La fontaine devait fonctionner en continu lors de deux contrôles indépendants avant l’échéance.',
    deadline: hoursFromNow(-72),
    state: 'BROKEN',
    evidenceLevel: 3,
    tier: 'ORANGE',
    stakes: { KEPT: 600, BROKEN: 900 },
    sources: [
      {
        label: 'Contrôle citoyen fictif A',
        url: 'https://example.org/sources/fontaine-exemple-controle-a',
        kind: 'reliable',
        independentGroup: 'observatoire-demo-a',
      },
      {
        label: 'Contrôle citoyen fictif B',
        url: 'https://example.org/sources/fontaine-exemple-controle-b',
        kind: 'reliable',
        independentGroup: 'observatoire-demo-b',
      },
    ],
  },
  {
    id: 'alerte-clinique-imaginaire',
    question: 'La Clinique Imaginaire a-t-elle publié son exercice d’alerte fictif avant l’échéance ?',
    criteria: 'Le compte rendu daté devait être publié avec les horaires de début et de fin de l’exercice.',
    deadline: hoursFromNow(-120),
    state: 'INCONCLUSIVE',
    evidenceLevel: 2,
    tier: 'RED',
    stakes: { KEPT: 440, BROKEN: 560 },
    sources: [
      {
        label: 'Bulletin local fictif',
        url: 'https://example.org/sources/clinique-imaginaire-bulletin',
        kind: 'reliable',
        independentGroup: 'bulletin-local-demo',
      },
      {
        label: 'Annonce de la Clinique Imaginaire',
        url: 'https://example.org/sources/clinique-imaginaire-annonce',
        kind: 'statement',
        independentGroup: 'clinique-imaginaire',
      },
    ],
  },
]
