// French BLOCKED keywords
export const BLOCKED_FRENCH_KEYWORDS = [
  'ethnie',
  'tribu',
  'religion',
  'tuer',
  'massacre',
  'génocide',
  'massacres',
  'exterminer',
  'lyncher',
  'suicide',
  'mourir',
  'mourra',
  'meurt',
  'décès',
  'mort de',
  'attentat',
  'assassinat',
  'voleur',
  'violeur',
  'criminel',
] as const

// English BLOCKED keywords
export const BLOCKED_ENGLISH_KEYWORDS = [
  'ethnic',
  'tribe',
  'religion',
  'kill',
  'murder',
  'attack',
  'death of',
  'thief',
  'rapist',
] as const

// French RED keywords
export const RED_FRENCH_KEYWORDS = [
  'guerre',
  'conflit armé',
  'sécurité',
  'rebelles',
  'tribunal',
  'procès',
  'épidémie',
  'élection',
  'attaque',
  'armée',
  'milice',
  'otage',
  'cessez-le-feu',
  'corruption',
  'détournement',
  'arrestation',
  'arrêté',
  'choléra',
  'mpox',
  "coup d'État",
  'Ebola',
] as const

// English RED keywords
export const RED_ENGLISH_KEYWORDS = [
  'war',
  'armed conflict',
  'trial',
  'epidemic',
  'election',
  'hostage',
  'ceasefire',
  'coup',
  'cholera',
] as const

// French ORANGE keywords
export const ORANGE_FRENCH_KEYWORDS = [
  'politique',
  'ministre',
  'président',
  'gouvernement',
  'promesse',
  'célébrité',
  'parlement',
  'sénat',
  'parti',
  'opposition',
  'mairie',
] as const

// English ORANGE keywords
export const ORANGE_ENGLISH_KEYWORDS = [
  'minister',
  'president',
  'government',
  'pledge',
  'celebrity',
  'parliament',
  'senate',
  'party',
  'opposition',
  'city hall',
] as const

// LOCAL_LANGUAGES: these keywords must be reviewed by a native speaker.
export const LOCAL_LANGUAGES = {
  swahili: {
    BLOCKED: ['kuua', 'mauaji', 'kabila'],
    RED: ['vita', 'uchaguzi'],
    ORANGE: ['serikali', 'rais', 'waziri', 'ahadi'],
  },
  lingala: {
    BLOCKED: ['koboma'],
    RED: ['etumba'],
    ORANGE: [],
  },
} as const

// Sport and schedule keywords eligible for GREEN
export const GREEN_KEYWORDS = [
  'match',
  'championnat',
  'ligue',
  'coupe',
  'score',
  'but',
  'calendrier',
  'football',
  'finale',
  'game',
  'league',
  'cup',
  'fixture',
] as const

export const BLOCKED_KEYWORDS = [
  ...BLOCKED_FRENCH_KEYWORDS,
  ...BLOCKED_ENGLISH_KEYWORDS,
  ...LOCAL_LANGUAGES.swahili.BLOCKED,
  ...LOCAL_LANGUAGES.lingala.BLOCKED,
] as const

export const RED_KEYWORDS = [
  ...RED_FRENCH_KEYWORDS,
  ...RED_ENGLISH_KEYWORDS,
  ...LOCAL_LANGUAGES.swahili.RED,
  ...LOCAL_LANGUAGES.lingala.RED,
] as const

export const ORANGE_KEYWORDS = [
  ...ORANGE_FRENCH_KEYWORDS,
  ...ORANGE_ENGLISH_KEYWORDS,
  ...LOCAL_LANGUAGES.swahili.ORANGE,
  ...LOCAL_LANGUAGES.lingala.ORANGE,
] as const
