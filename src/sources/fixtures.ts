import type { Candidate } from '../ai/types'

export const FIXTURE_NEWS = [
  {
    title: 'Le Sporting Brume jouera la finale de la Coupe des Lanternes',
    sourceUrl: 'https://example.org/news/sporting-brume-finale',
    excerpt:
      'Scénario de démonstration fictif : le calendrier annonce la finale du club imaginaire.',
    publishedAt: '2026-10-02T09:00:00.000Z',
  },
  {
    title: 'La Mairie de Belrivage promet une navette avant la fin de saison',
    sourceUrl: 'https://example.org/news/belrivage-navette',
    excerpt:
      'Scénario de démonstration fictif : la commune inventée présente un calendrier de mise en service.',
    publishedAt: '2026-10-04T11:30:00.000Z',
  },
  {
    title: 'Le Festival des Lucioles publiera son programme complet',
    sourceUrl: 'https://example.org/news/festival-lucioles-programme',
    excerpt:
      'Scénario de démonstration fictif : l’organisation imaginaire prévoit une publication publique.',
    publishedAt: '2026-10-07T14:15:00.000Z',
  },
  {
    title: 'La Ligue des Collines fixe le match du FC Horizon',
    sourceUrl: 'https://example.org/news/ligue-collines-match',
    excerpt:
      'Scénario de démonstration fictif : une ligue inventée inscrit un match à son calendrier.',
    publishedAt: '2026-10-10T08:45:00.000Z',
  },
  {
    title: 'L’élection fictive de l’Archipel Azur aura un tableau de résultats',
    sourceUrl: 'https://example.org/news/archipel-azur-election',
    excerpt:
      'Scénario de démonstration fictif : la commission imaginaire annonce une publication après le scrutin.',
    publishedAt: '2026-10-12T16:00:00.000Z',
  },
  {
    title: 'Le Centre Médical Nébuleuse prépare un bulletin d’épidémie simulée',
    sourceUrl: 'https://example.org/news/nebuleuse-bulletin',
    excerpt:
      'Scénario de démonstration fictif : cet exercice éditorial ne décrit aucun événement réel.',
    publishedAt: '2026-10-15T10:20:00.000Z',
  },
] as const satisfies readonly Candidate[] 
